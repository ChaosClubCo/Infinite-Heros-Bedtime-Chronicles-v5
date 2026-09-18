import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateRuntimeConfiguration } from '../../scripts/verify-release-proof.mjs';

const ROOT = process.cwd();

function readText(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function listedEnvKeys(example: string): string[] {
  return example
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#') && line.includes('='))
    .map((line) => line.slice(0, line.indexOf('=')));
}

describe('toolchain and local env setup', () => {
  const pkg = readJson<{
    engines?: { node?: string };
    scripts: Record<string, string>;
  }>('package.json');
  const nvmrc = readText('.nvmrc').trim();
  const envExample = readText('.env.example');
  const readme = readText('README.md');
  const easWorkflow = readText('.github/workflows/eas-build.yml');
  const geminiProvider = readText('server/ai/providers/gemini.ts');
  const routes = readText('server/routes.ts');

  it('pins the repo-validated Node 22.x toolchain', () => {
    expect(nvmrc === '22' || nvmrc.startsWith('22.')).toBe(true);
    expect(pkg.engines?.node).toBe('>=22.15.0 <23');
    expect(easWorkflow).toContain("node-version-file: '.nvmrc'");
    expect(easWorkflow).toContain('= "22"');
    const runtime = validateRuntimeConfiguration();
    expect(runtime.failures.filter((failure) => failure.includes('.nvmrc') || failure.includes('engines.node'))).toEqual([]);
  });

  it('loads the copied .env from both documented API start scripts', () => {
    expect(pkg.scripts['server:dev']).toContain('--env-file-if-exists=.env');
    expect(pkg.scripts['dev:server']).toContain('--env-file-if-exists=.env');
    expect(envExample).toContain('Copy to .env');
    expect(readme).toContain('npm run server:dev');
  });

  it('treats AI_INTEGRATIONS_GEMINI_API_KEY as canonical with a legacy GEMINI_API_KEY fallback', () => {
    expect(listedEnvKeys(envExample)).toContain('AI_INTEGRATIONS_GEMINI_API_KEY');
    expect(envExample).toContain('legacy GEMINI_API_KEY');
    expect(geminiProvider).toContain('process.env.AI_INTEGRATIONS_GEMINI_API_KEY');
    expect(geminiProvider).toContain('process.env.GEMINI_API_KEY');
    expect(routes).toContain('process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GEMINI_API_KEY');
  });

  it('keeps README as a highlight table and documents production/dev vars in .env.example', () => {
    expect(readme.toLowerCase()).not.toMatch(/full environment-variable list/);
    expect(readme).toContain('not an exhaustive catalog');
    const exampleKeys = listedEnvKeys(envExample);
    for (const key of [
      'VOICE_CHAT_TRANSCRIPT_RETENTION_DAYS',
      'RATE_LIMIT_WINDOW_MS',
      'RATE_LIMIT_MAX',
      'FEATURE_VIDEO_ENABLED',
      'FEATURE_VOICE_CHAT_ENABLED',
      'FEATURE_REALTIME_MEDIA_ENABLED',
      'TTS_CACHE_MAX_AGE_MS',
      'TTS_CACHE_MAX_SIZE_BYTES',
      'AI_INTEGRATIONS_GEMINI_BASE_URL',
      'AI_INTEGRATIONS_OPENAI_BASE_URL',
      'AI_INTEGRATIONS_ANTHROPIC_BASE_URL',
      'AI_INTEGRATIONS_OPENROUTER_BASE_URL',
    ]) {
      expect(exampleKeys).toContain(key);
    }
  });
});
