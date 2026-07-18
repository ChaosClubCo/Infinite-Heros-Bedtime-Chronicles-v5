import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(
  resolve(process.cwd(), '.github/workflows/release-proof.yml'),
  'utf8',
);

describe('exact-SHA release workflow integrity', () => {
  it('requires an exact candidate and publishes the authoritative run immediately', () => {
    expect(workflow).toContain('release_sha:');
    expect(workflow).toContain('[[ "$RELEASE_SHA" =~ ^[0-9a-f]{40}$ ]]');
    expect(workflow).toContain('Publish authoritative run record');
    expect(workflow).toContain('Comment run URL immediately');
    expect(workflow).toContain('context.runId');
  });

  it('checks out and verifies only the requested candidate', () => {
    expect(workflow).toContain('ref: ${{ env.RELEASE_SHA }}');
    expect(workflow).toContain('test "$(git rev-parse HEAD)" = "$RELEASE_SHA"');
    expect(workflow).toContain('persist-credentials: false');
  });

  it('runs the complete repository gate set including native component tests', () => {
    for (const command of [
      'npm run preflight',
      'npm run lint',
      'npm test',
      'npm run test:components',
      'npm run typecheck',
      'npm audit --audit-level=critical',
      'npm run server:build',
      'npm run expo:check',
      'npm run expo:build:ci',
    ]) {
      expect(workflow).toContain(command);
    }
  });

  it('uploads machine-readable evidence and checksums even on failure', () => {
    expect(workflow).toContain('if: always()');
    expect(workflow).toContain('repository-gates.json');
    expect(workflow).toContain('deployed-smoke.json');
    expect(workflow).toContain('release-evidence.json');
    expect(workflow).toContain('sha256sum');
  });

  it('does not misrepresent event emission as received alert proof or approve release', () => {
    expect(workflow).toContain('notificationReceiptVerified: false');
    expect(workflow).toContain('releaseApproved: false');
    expect(workflow).toContain('No release approval was issued.');
    expect(workflow).not.toContain('releaseApproved: true');
  });
});
