import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

function readText(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function runNode(source: string): ReturnType<typeof spawnSync> {
  return spawnSync(process.execPath, ['-e', source], {
    cwd: ROOT,
    encoding: 'utf8',
  });
}

describe('jest-expo React Native preset resolution', () => {
  const pkg = readJson<{
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    scripts: Record<string, string>;
    overrides?: Record<string, string | Record<string, unknown>>;
    expo?: { install?: { exclude?: string[] } };
  }>('package.json');

  it('pins RN 0.87 Jest companion packages to the same version as react-native', () => {
    expect(pkg.dependencies['react-native']).toBe('0.87.1');
    expect(pkg.devDependencies['@react-native/jest-preset']).toBe('0.87.1');
    expect(pkg.devDependencies['@react-native/assets-registry']).toBe('0.87.1');
    expect(pkg.devDependencies['@react-native/js-polyfills']).toBe('0.87.1');
  });

  it('overrides hermes-parser so RN 0.87 Flow specs can be transformed', () => {
    expect(pkg.overrides?.['babel-plugin-syntax-hermes-parser']).toBe('0.36.1');
    expect(pkg.overrides?.['hermes-parser']).toBe('0.36.1');
  });

  it('keeps the jest-expo preset and loads the RN export shim before it', () => {
    const jestConfig = readText('jest.config.js');
    expect(pkg.scripts['test:components']).toBe('jest');
    expect(jestConfig).toContain("preset: 'jest-expo'");
    expect(jestConfig).toContain("require('./scripts/rn-jest-preset-shim.cjs')");
    expect(jestConfig.indexOf("require('./scripts/rn-jest-preset-shim.cjs')")).toBeLessThan(
      jestConfig.indexOf("preset: 'jest-expo'"),
    );
  });

  it('patches RN 0.87 to restore the jest-preset and rn-get-polyfills exports', () => {
    const patch = readText('patches/react-native+0.87.1.patch');
    expect(patch).toContain('"./jest-preset": "./jest-preset.js"');
    expect(patch).toContain('"./rn-get-polyfills": "./rn-get-polyfills.js"');
    expect(patch).toContain("require('@react-native/jest-preset')");
    expect(patch).toContain("require('@react-native/js-polyfills')");
  });

  it('lets jest-expo resolve react-native/jest-preset after the RN export patch', () => {
    const result = runNode("require('react-native/jest-preset'); process.stdout.write('ok');");
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('ok');
  });

  it('lets Expo Metro resolve react-native/rn-get-polyfills after the RN export patch', () => {
    const result = runNode(
      "const fn = require('react-native/rn-get-polyfills'); if (typeof fn !== 'function' || fn().length < 1) process.exit(2); process.stdout.write('ok');",
    );
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('ok');
  });

  it('lets jest-expo resolve react-native/jest-preset through the shim', () => {
    const result = runNode(
      "require('./scripts/rn-jest-preset-shim.cjs'); require('react-native/jest-preset'); process.stdout.write('ok');",
    );
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('ok');
  });

  it('excludes the intentional RN 0.87 / React 19.2.8 pins from expo install --check', () => {
    const excluded = pkg.expo?.install?.exclude ?? [];
    for (const name of [
      'react',
      'react-dom',
      '@types/react-dom',
      'react-native',
      'react-native-keyboard-controller',
      'react-native-reanimated',
      'react-native-svg',
      'react-native-worklets',
    ]) {
      expect(excluded).toContain(name);
    }
  });
});
