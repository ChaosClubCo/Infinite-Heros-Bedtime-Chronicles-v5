import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const packageJson = JSON.parse(
  readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
) as { repository?: string };
const evidence = readFileSync(
  resolve(process.cwd(), 'docs/production-readiness/RELEASE_EVIDENCE.md'),
  'utf8',
);

describe('canonical release source', () => {
  it('points package metadata to the private canonical repository', () => {
    expect(packageJson.repository).toBe(
      'https://github.com/ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5',
    );
  });

  it('keeps the public copy explicitly non-canonical and release-blocking until archived', () => {
    expect(evidence).toContain('Krosebrook/Infinite-Heros-Bedtime-Chronicles-v5-main');
    expect(evidence).toContain('archived: false');
    expect(evidence).toContain('Public mirror archive | FAIL');
  });
});
