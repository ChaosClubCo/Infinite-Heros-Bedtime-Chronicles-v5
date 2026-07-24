import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  REQUIRED_INCLUDE_FILES,
  validateVercelConfig,
  verifyVercelRuntimeAssets,
} from './verify-vercel-runtime-assets.mjs';

const VALID_CONFIG = {
  version: 2,
  framework: null,
  buildCommand:
    'npm run server:build && npx expo export --platform web --output-dir static-build && node scripts/verify-vercel-runtime-assets.mjs --require-build-artifacts',
  functions: {
    'api/server.mjs': {
      maxDuration: 300,
      includeFiles: REQUIRED_INCLUDE_FILES,
    },
  },
  rewrites: [{ source: '/(.*)', destination: '/api/server' }],
};

describe('Vercel runtime asset verification', () => {
  let rootDirectory: string;

  beforeEach(() => {
    rootDirectory = mkdtempSync(join(tmpdir(), 'vercel-runtime-assets-'));
  });

  afterEach(() => {
    rmSync(rootDirectory, { recursive: true, force: true });
  });

  it('accepts the canonical brace-expanded runtime bundle pattern', () => {
    expect(validateVercelConfig(VALID_CONFIG)).toEqual([]);
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
    writeFileSync(join(rootDirectory, 'vercel.json'), JSON.stringify(VALID_CONFIG));

    const errors = verifyVercelRuntimeAssets({
      rootDirectory,
      requireBuildArtifacts: true,
    });

    expect(errors).toContain('Required Vercel runtime artifact is missing: static-build/index.html');
    expect(errors).toContain('Required Vercel runtime artifact is missing: server/templates/landing-page.html');
  });

  it('passes when the generated server, Expo export, templates, app metadata, and assets exist', () => {
    writeFileSync(join(rootDirectory, 'vercel.json'), JSON.stringify(VALID_CONFIG));
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
