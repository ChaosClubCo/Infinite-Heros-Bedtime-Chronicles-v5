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
  }>('package.json');

  it('pins RN 0.87 Jest companion packages to the same version as react-native', () => {
    expect(pkg.dependencies['react-native']).toBe('0.87.1');
    expect(pkg.devDependencies['@react-native/jest-preset']).toBe('0.87.1');
    expect(pkg.devDependencies['@react-native/assets-registry']).toBe('0.87.1');
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

  it('documents that RN 0.87 no longer exports ./jest-preset', () => {
    const result = runNode("require('react-native/jest-preset')");
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('ERR_PACKAGE_PATH_NOT_EXPORTED');
    expect(result.stderr).toContain('./jest-preset');
  });

  it('lets jest-expo resolve react-native/jest-preset through the shim', () => {
    const result = runNode(
      "require('./scripts/rn-jest-preset-shim.cjs'); require('react-native/jest-preset'); process.stdout.write('ok');",
    );
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('ok');
  });
});
