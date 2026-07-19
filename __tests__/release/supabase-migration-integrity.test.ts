import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const migrationDirectory = resolve(repositoryRoot, 'supabase/migrations');
const migrationNames = readdirSync(migrationDirectory).sort();

const maintainedTextExtensions = new Set([
  '.cjs',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.sh',
  '.sql',
  '.ts',
  '.tsx',
  '.yaml',
  '.yml',
]);

function trackedTextFiles(): string[] {
  return execFileSync('git', ['ls-files', '-z'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  })
    .split('\0')
    .filter((path) => path.length > 0 && maintainedTextExtensions.has(extname(path)));
}

describe('Supabase migration integrity', () => {
  it('preserves every authoritative remote migration version locally', () => {
    for (const version of [
      '20260506034535',
      '20260506034551',
      '20260506034606',
      '20260613033013',
      '20260625160453',
      '20260713000817',
    ]) {
      expect(migrationNames.some((name) => name.startsWith(`${version}_`))).toBe(true);
    }
  });

  it('uses timestamped, unique, ordered migration versions', () => {
    const versions = migrationNames.map((name) => name.split('_', 1)[0]);
    expect(versions.every((version) => /^\d{14}$/.test(version))).toBe(true);
    expect(new Set(versions).size).toBe(versions.length);
    expect(versions).toEqual([...versions].sort());
  });

  it('resolves every tracked migration reference to a file on disk', () => {
    const migrationReference = /\bsupabase\/migrations\/([A-Za-z0-9._-]+\.sql)\b/g;

    for (const repositoryPath of trackedTextFiles()) {
      const source = readFileSync(resolve(repositoryRoot, repositoryPath), 'utf8');
      for (const match of source.matchAll(migrationReference)) {
        const referencedPath = match[0];
        expect(
          existsSync(resolve(repositoryRoot, referencedPath)),
          `${repositoryPath} references missing migration ${referencedPath}`,
        ).toBe(true);
      }
    }
  });

  it('scopes optimized sync policies to authenticated users and caches auth.uid()', () => {
    const migrationName = migrationNames.find((name) => name.endsWith('_optimize_sync_records_rls.sql'));
    expect(migrationName).toBeDefined();
    const sql = readFileSync(resolve(migrationDirectory, migrationName!), 'utf8');
    expect(sql.match(/for (select|insert|update|delete) to authenticated/g)).toHaveLength(4);
    expect(sql.match(/\(select auth\.uid\(\)\)/g)).toHaveLength(5);
    expect(sql).not.toMatch(/to public/);
  });
});
