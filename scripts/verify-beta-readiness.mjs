import { readFile } from 'node:fs/promises';
import process from 'node:process';

const manifestPath = process.argv[2] ?? 'docs/evidence/beta-acceptance-manifest.json';

const VALID_STATUSES = new Set(['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN']);

function fail(message) {
  console.error(`beta-readiness: ${message}`);
  process.exitCode = 1;
}

let manifest;
try {
  manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
} catch (error) {
  fail(`unable to read manifest at ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`);
  process.exit();
}

if (!Array.isArray(manifest.gates) || manifest.gates.length === 0) {
  fail('manifest.gates must contain at least one gate');
  process.exit();
}

for (const gate of manifest.gates) {
  if (typeof gate.id !== 'string' || typeof gate.name !== 'string') {
    fail('every gate must have string id and name fields');
    continue;
  }
  if (typeof gate.mandatory !== 'boolean') {
    fail(`${gate.id}: mandatory must be boolean`);
  }
  if (!VALID_STATUSES.has(gate.status)) {
    fail(`${gate.id}: invalid status ${JSON.stringify(gate.status)}`);
  }
  if (!Array.isArray(gate.evidence)) {
    fail(`${gate.id}: evidence must be an array`);
  }
}

const mandatory = manifest.gates.filter((gate) => gate.mandatory === true);
const blocked = mandatory.filter((gate) => gate.status !== 'PASS');
const p0 = Number(manifest.defects?.openP0 ?? 0);
const p1 = Number(manifest.defects?.openP1 ?? 0);
const allowedP0 = Number(manifest.policy?.maxOpenP0 ?? 0);
const allowedP1 = Number(manifest.policy?.maxOpenP1 ?? 0);

const computedDecision = blocked.length === 0 && p0 <= allowedP0 && p1 <= allowedP1 ? 'PASS' : 'BLOCKED';

console.log(JSON.stringify({
  manifest: manifestPath,
  candidate: manifest.candidate,
  mandatoryGateCount: mandatory.length,
  passingMandatoryGateCount: mandatory.length - blocked.length,
  blockingGates: blocked.map(({ id, name, status }) => ({ id, name, status })),
  defects: { openP0: p0, openP1: p1 },
  computedDecision,
}, null, 2));

if (manifest.decision !== computedDecision) {
  fail(`manifest decision ${JSON.stringify(manifest.decision)} disagrees with computed decision ${computedDecision}`);
}

if (computedDecision !== 'PASS') {
  fail('candidate is not beta-ready');
}
