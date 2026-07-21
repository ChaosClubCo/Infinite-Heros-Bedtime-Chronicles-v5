import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const migrationRoot = join(repositoryRoot, 'supabase', 'migrations');

const excludedDirectories = new Set([
  '.git',
  '.expo',
  '.next',
  'coverage',
  'dist',
  'node_modules',
  'server_dist',
  'static-build',
  'mnt',
]);

const searchableExtensions = new Set([
  '.cjs',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
  '.yaml',
  '.yml',
]);

// Every maintained repository reference must resolve to a migration present at the exact candidate.
const migrationReferencePattern = /supabase\/migrations\/([A-Za-z0-9_.-]+\.sql)/g;

function walkFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (excludedDirectories.has(entry.name)) {
      return [];
    }

    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(absolutePath);
    }

    if (!entry.isFile() || !searchableExtensions.has(extname(entry.name))) {
      return [];
    }

    return [absolutePath];
  });
}

describe('Supabase migration references', () => {
  it('resolves every referenced migration file on disk', () => {
    expect(existsSync(migrationRoot)).toBe(true);
    expect(statSync(migrationRoot).isDirectory()).toBe(true);

    const migrationFiles = new Set(
      readdirSync(migrationRoot, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
        .map((entry) => entry.name),
    );

    const brokenReferences: string[] = [];

    for (const absolutePath of walkFiles(repositoryRoot)) {
      const repositoryPath = relative(repositoryRoot, absolutePath).replaceAll('\\', '/');
      const source = readFileSync(absolutePath, 'utf8');

      for (const match of source.matchAll(migrationReferencePattern)) {
        const referencedFile = match[1];
        if (!migrationFiles.has(referencedFile)) {
          brokenReferences.push(`${repositoryPath}: supabase/migrations/${referencedFile}`);
        }
      }
    }

    expect(brokenReferences).toEqual([]);
  });

  it('does not retain the pre-reconciliation migration paths', () => {
    const obsoletePaths = [
      ['supabase/migrations/', '0001_sync_tables.sql'].join(''),
      ['supabase/migrations/', '0002_voice_chat_retention.sql'].join(''),
    ];

    const hits: string[] = [];

    for (const absolutePath of walkFiles(repositoryRoot)) {
      const repositoryPath = relative(repositoryRoot, absolutePath).replaceAll('\\', '/');
      const source = readFileSync(absolutePath, 'utf8');

      for (const obsoletePath of obsoletePaths) {
        if (source.includes(obsoletePath)) {
          hits.push(`${repositoryPath}: ${obsoletePath}`);
        }
      }
    }

    expect(hits).toEqual([]);
  });
});
