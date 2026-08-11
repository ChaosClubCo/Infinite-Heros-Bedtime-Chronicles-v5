import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  REQUIRED_BUILD_SCRIPT_COMMANDS,
  REQUIRED_INCLUDE_FILES,
  VERCEL_BUILD_COMMAND,
  VERCEL_BUILD_SCRIPT,
  validateVercelBuildScript,
  validateVercelConfig,
  verifyVercelRuntimeAssets,
} from '../scripts/verify-vercel-runtime-assets.mjs';

const VALID_CONFIG = {
  version: 2,
  framework: null,
  buildCommand: VERCEL_BUILD_COMMAND,
  functions: {
    'api/server.mjs': {
      maxDuration: 300,
      includeFiles: REQUIRED_INCLUDE_FILES,
    },
  },
  rewrites: [{ source: '/(.*)', destination: '/api/server' }],
};

const VALID_BUILD_SCRIPT = `#!/usr/bin/env bash
set -euo pipefail
${REQUIRED_BUILD_SCRIPT_COMMANDS.join('\n')}
`;

function writeConfigAndBuildScript(rootDirectory: string): void {
  writeFileSync(join(rootDirectory, 'vercel.json'), JSON.stringify(VALID_CONFIG));
  mkdirSync(join(rootDirectory, 'scripts'), { recursive: true });
  writeFileSync(join(rootDirectory, VERCEL_BUILD_SCRIPT), VALID_BUILD_SCRIPT);
}

describe('Vercel runtime asset verification', () => {
  let rootDirectory: string;

  beforeEach(() => {
    rootDirectory = mkdtempSync(join(tmpdir(), 'vercel-runtime-assets-'));
  });

  afterEach(() => {
    rmSync(rootDirectory, { recursive: true, force: true });
  });

  it('accepts the bounded build command and canonical runtime bundle pattern', () => {
    expect(validateVercelConfig(VALID_CONFIG)).toEqual([]);
    expect(validateVercelBuildScript(VALID_BUILD_SCRIPT)).toEqual([]);
  });

  it('rejects removal of the high and critical dependency audit gate', () => {
    const invalidScript = VALID_BUILD_SCRIPT.replace('node scripts/audit-gate.mjs\n', '');

    expect(validateVercelBuildScript(invalidScript)).toContain(
      `${VERCEL_BUILD_SCRIPT} is missing required command: node scripts/audit-gate.mjs`,
    );
  });

  it('rejects an expanded inline build command', () => {
    const invalidConfig = structuredClone(VALID_CONFIG);
    invalidConfig.buildCommand = REQUIRED_BUILD_SCRIPT_COMMANDS.join(' && ');

    expect(validateVercelConfig(invalidConfig)).toContainEqual(
      expect.stringContaining('buildCommand must be'),
    );
  });

  it('rejects the comma-delimited pattern that Vercel treats as one literal glob', () => {
    const invalidConfig = structuredClone(VALID_CONFIG);
    invalidConfig.functions['api/server.mjs'].includeFiles =
      'server_dist/**,static-build/**,assets/**,server/templates/**,app.json';

    expect(validateVercelConfig(invalidConfig)).toContainEqual(
      expect.stringContaining('includeFiles must be'),
    );
  });

  it('fails closed when generated runtime files are missing', () => {
    writeConfigAndBuildScript(rootDirectory);

    const errors = verifyVercelRuntimeAssets({
      rootDirectory,
      requireBuildArtifacts: true,
    });

    expect(errors).toContain('Required Vercel runtime artifact is missing: static-build/index.html');
    expect(errors).toContain('Required Vercel runtime artifact is missing: server/templates/landing-page.html');
  });

  it('passes when the build script, server, Expo export, templates, app metadata, and assets exist', () => {
    writeConfigAndBuildScript(rootDirectory);
    mkdirSync(join(rootDirectory, 'server_dist'), { recursive: true });
    mkdirSync(join(rootDirectory, 'static-build'), { recursive: true });
    mkdirSync(join(rootDirectory, 'server', 'templates'), { recursive: true });
    mkdirSync(join(rootDirectory, 'assets'), { recursive: true });
    writeFileSync(join(rootDirectory, 'server_dist', 'index.js'), 'export {};');
    writeFileSync(join(rootDirectory, 'static-build', 'index.html'), '<!doctype html>');
    writeFileSync(join(rootDirectory, 'server', 'templates', 'landing-page.html'), '<!doctype html>');
    writeFileSync(join(rootDirectory, 'app.json'), '{}');

    expect(
      verifyVercelRuntimeAssets({ rootDirectory, requireBuildArtifacts: true }),
    ).toEqual([]);
  });
});
