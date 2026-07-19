import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const releaseWorkflow = readFileSync(
  resolve(process.cwd(), '.github/workflows/release-proof.yml'),
  'utf8',
);
const ciWorkflow = readFileSync(resolve(process.cwd(), '.github/workflows/ci.yml'), 'utf8');
const publishWorkflow = readFileSync(
  resolve(process.cwd(), '.github/workflows/publish.yml'),
  'utf8',
);
const securityWorkflow = readFileSync(
  resolve(process.cwd(), '.github/workflows/agent-security.yml'),
  'utf8',
);
const securityAgent = readFileSync(
  resolve(process.cwd(), 'agents/security/index.js'),
  'utf8',
);

describe('exact-SHA release workflow integrity', () => {
  it('requires an exact candidate and publishes the authoritative run immediately', () => {
    expect(releaseWorkflow).toContain('release_sha:');
    expect(releaseWorkflow).toContain('[[ "$RELEASE_SHA" =~ ^[0-9a-f]{40}$ ]]');
    expect(releaseWorkflow).toContain('Publish authoritative run record');
    expect(releaseWorkflow).toContain('Comment run URL immediately');
    expect(releaseWorkflow).toContain('context.runId');
  });

  it('checks out and verifies only the requested candidate', () => {
    expect(releaseWorkflow).toContain('ref: ${{ env.RELEASE_SHA }}');
    expect(releaseWorkflow).toContain('test "$(git rev-parse HEAD)" = "$RELEASE_SHA"');
    expect(releaseWorkflow).toContain('persist-credentials: false');
  });

  it('runs the complete repository gate set including native component tests', () => {
    for (const command of [
      'npm run preflight',
      'npm run lint -- --max-warnings=0',
      'npm test',
      'npm run test:components',
      'npm run typecheck',
      'npm audit --audit-level=high',
      'npm run server:build',
      'npm run expo:check',
      'npm run expo:build:ci',
    ]) {
      expect(releaseWorkflow).toContain(command);
    }
  });

  it('keeps redirects on HTTPS and verifies final no-store headers', () => {
    expect(releaseWorkflow).toContain("--proto '=https' --proto-redir '=https'");
    expect(releaseWorkflow).toContain('assert_final_header health-headers.txt cache-control no-store');
    expect(releaseWorkflow).toContain('assert_final_header privacy-headers.txt cache-control no-store');
    expect(releaseWorkflow).toContain('assert_final_header health-headers.txt strict-transport-security max-age');
  });

  it('uploads machine-readable evidence and checksums even on failure', () => {
    expect(releaseWorkflow).toContain('if: always()');
    expect(releaseWorkflow).toContain('repository-gates.json');
    expect(releaseWorkflow).toContain('deployed-smoke.json');
    expect(releaseWorkflow).toContain('release-evidence.json');
    expect(releaseWorkflow).toContain('sha256sum');
  });

  it('does not misrepresent event emission as received alert proof or approve release', () => {
    expect(releaseWorkflow).toContain('notificationReceiptVerified: false');
    expect(releaseWorkflow).toContain('alert_notification_evidence_url:');
    expect(releaseWorkflow).toContain('alertNotificationEvidenceUrl: process.env.ALERT_NOTIFICATION_EVIDENCE');
    expect(releaseWorkflow).toContain('releaseApproved: false');
    expect(releaseWorkflow).toContain('No release approval was issued.');
    expect(releaseWorkflow).not.toContain('releaseApproved: true');
  });

  it('defaults evidence reporting to the active NO-GO ledger', () => {
    expect(releaseWorkflow).toContain('default: "376"');
    expect(releaseWorkflow).not.toContain('default: "370"');
  });
});

describe('release gate parity', () => {
  it('keeps all edited workflow files syntactically valid YAML', () => {
    for (const workflow of [ciWorkflow, publishWorkflow, releaseWorkflow, securityWorkflow]) {
      expect(() => parse(workflow)).not.toThrow();
    }
  });

  it('enforces zero-warning lint and high-severity audit in CI, publish, and release proof', () => {
    for (const workflow of [ciWorkflow, publishWorkflow, releaseWorkflow]) {
      expect(workflow).toContain('npm run lint -- --max-warnings=0');
      expect(workflow).toContain('npm audit --audit-level=high');
      expect(workflow).not.toContain('npm audit --audit-level=critical');
    }
  });

  it('runs publish gates before package publication', () => {
    const publishIndex = publishWorkflow.indexOf('run: npm publish');
    expect(publishIndex).toBeGreaterThan(-1);
    for (const command of [
      'npm run lint -- --max-warnings=0',
      'npm test',
      'npm run test:components',
      'npm audit --audit-level=high',
      'npm run typecheck',
      'npm run server:build',
    ]) {
      const gateIndex = publishWorkflow.indexOf(command);
      expect(gateIndex).toBeGreaterThan(-1);
      expect(gateIndex).toBeLessThan(publishIndex);
    }
  });

  it('does not swallow CodeQL analysis failures', () => {
    expect(securityWorkflow).toContain('github/codeql-action/analyze@v4');
    expect(securityWorkflow).not.toContain('continue-on-error');
  });

  it('runs the security audit on Windows and Unix agents', () => {
    expect(securityAgent).toContain("process.platform === 'win32' ? 'npm.cmd' : 'npm'");
    expect(securityAgent).toContain('`--audit-level=${level}`');
    expect(securityAgent).toContain("shell: process.platform === 'win32'");
  });
});
