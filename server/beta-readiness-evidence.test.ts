import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertExpectedSha,
  sha256,
  validateManifest,
} from '../scripts/beta-readiness-evidence.mjs';

const candidateSha = 'a'.repeat(40);
const templateSha256 = 'b'.repeat(64);
const policy = {
  receiptMaxAgeHours: 168,
  maxOpenP0: 0,
  maxOpenP1: 0,
  requireDefectReceipt: false,
  requireTrustedProvenance: true,
  promotionEnabled: false,
};
const template = {
  repository: 'example/repository',
  policy,
  gates: [{ id: 'BR-01', name: 'Locked install', mandatory: true }],
};

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'beta-evidence-'));
  await mkdir(root, { recursive: true });
  const receipt = {
    gateId: 'BR-01',
    candidateSha,
    status: 'PASS',
    executedAt: '2026-08-24T20:00:00.000Z',
    source: { provider: 'github-actions', uri: 'https://github.com/example/actions/runs/1' },
  };
  const bytes = Buffer.from(JSON.stringify(receipt));
  await writeFile(join(root, 'BR-01.json'), bytes);
  return {
    root,
    manifest: {
      kind: 'BetaAcceptanceManifest/v2',
      repository: template.repository,
      candidate: { sha: candidateSha },
      policyTemplate: { sha256: templateSha256 },
      policy,
      provenance: { assurance: 'CANDIDATE_GENERATED', promotable: false, attestation: null },
      gates: [{ id: 'BR-01', name: 'Locked install', mandatory: true, status: 'PASS', receipt: { path: 'BR-01.json', sha256: sha256(bytes) } }],
      defects: { openP0: 0, openP1: 0, receipt: null },
      decision: 'BLOCKED',
    },
  };
}

describe('beta readiness evidence', () => {
  it('accepts a fresh receipt structurally but keeps candidate evidence non-promotable', async () => {
    const { root, manifest } = await fixture();
    const result = await validateManifest(manifest, {
      currentHead: candidateSha,
      evidenceDir: root,
      template,
      templateSha256,
      now: new Date('2026-08-24T20:01:00.000Z'),
    });
    expect(result).toEqual({ ok: true, errors: [], computedDecision: 'BLOCKED' });
  });

  it('treats an expected SHA only as an assertion against git HEAD', () => {
    expect(assertExpectedSha(candidateSha, candidateSha.toUpperCase())).toBe(candidateSha);
    expect(() => assertExpectedSha(candidateSha, 'c'.repeat(40))).toThrow(
      `expected SHA ${'c'.repeat(40)} does not equal git HEAD ${candidateSha}`,
    );
  });

  it('rejects candidate drift and receipt tampering', async () => {
    const { root, manifest } = await fixture();
    await writeFile(join(root, 'BR-01.json'), '{}');
    const result = await validateManifest(manifest, {
      currentHead: 'c'.repeat(40),
      evidenceDir: root,
      template,
      templateSha256,
      now: new Date('2026-08-24T20:01:00.000Z'),
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('candidate.sha does not equal the checked-out HEAD');
    expect(result.errors).toContain('BR-01: receipt digest mismatch');
  });
});
