#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import process from 'node:process';
import { assertExpectedSha, computeDecision, sha256 } from './beta-readiness-evidence.mjs';

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const templatePath = resolve(option('--template', 'docs/evidence/beta-acceptance-manifest.json'));
const evidenceDir = resolve(option('--evidence-dir', '.release-evidence/receipts'));
const outputPath = resolve(option('--output', '.release-evidence/beta-acceptance-manifest.json'));
if (process.argv.includes('--sha')) {
  throw new Error('--sha is unsafe and unsupported; use --expected-sha as an assertion');
}
const gitHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const candidateSha = assertExpectedSha(gitHead, option('--expected-sha'));
const templateBytes = await readFile(templatePath);
const template = JSON.parse(templateBytes.toString('utf8'));

const gates = [];
for (const gate of template.gates) {
  const receiptPath = resolve(evidenceDir, `${gate.id}.json`);
  try {
    const receiptBytes = await readFile(receiptPath);
    const receipt = JSON.parse(receiptBytes.toString('utf8'));
    gates.push({
      ...gate,
      status: receipt.status,
      receipt: {
        path: relative(evidenceDir, receiptPath).replaceAll('\\', '/'),
        sha256: sha256(receiptBytes),
      },
    });
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    gates.push({ ...gate, status: 'NOT_RUN', receipt: null });
  }
}

let defects = { openP0: null, openP1: null, receipt: null };
try {
  const path = resolve(evidenceDir, 'defects.json');
  const bytes = await readFile(path);
  const receipt = JSON.parse(bytes.toString('utf8'));
  defects = {
    openP0: receipt.openP0,
    openP1: receipt.openP1,
    receipt: { path: 'defects.json', sha256: sha256(bytes) },
  };
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const manifest = {
  kind: 'BetaAcceptanceManifest/v2',
  manifestVersion: template.manifestVersion,
  project: template.project,
  repository: template.repository,
  candidate: {
    sha: candidateSha,
    baseBranch: template.baseBranch,
    generatedAt: new Date().toISOString(),
  },
  policyTemplate: {
    path: relative(process.cwd(), templatePath).replaceAll('\\', '/'),
    sha256: sha256(templateBytes),
  },
  policy: template.policy,
  provenance: {
    assurance: 'CANDIDATE_GENERATED',
    promotable: false,
    attestation: null,
  },
  gates,
  defects,
  decision: 'BLOCKED',
};
manifest.decision = computeDecision(manifest);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'w' });
console.log(JSON.stringify({ output: outputPath, candidateSha, decision: manifest.decision }, null, 2));
