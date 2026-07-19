import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationDirectory = resolve(process.cwd(), 'supabase/migrations');
const migrationNames = readdirSync(migrationDirectory).sort();

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

  it('scopes optimized sync policies to authenticated users and caches auth.uid()', () => {
    const migrationName = migrationNames.find((name) => name.endsWith('_optimize_sync_records_rls.sql'));
    expect(migrationName).toBeDefined();
    const sql = readFileSync(resolve(migrationDirectory, migrationName!), 'utf8');
    expect(sql.match(/for (select|insert|update|delete) to authenticated/g)).toHaveLength(4);
    expect(sql.match(/\(select auth\.uid\(\)\)/g)).toHaveLength(5);
    expect(sql).not.toMatch(/to public/);
  });
});
