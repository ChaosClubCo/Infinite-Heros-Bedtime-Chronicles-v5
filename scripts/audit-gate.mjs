#!/usr/bin/env node
/**
 * Security audit gate: fails on any high/critical npm audit advisory unless
 * it appears in the dated allowlist below.
 *
 * The allowlist exists only for advisories with NO patched upstream release,
 * where npm's suggested "fix" is a breaking downgrade. Each entry carries an
 * expiry date; the gate fails once that date passes, forcing a re-review
 * instead of letting exceptions rot.
 *
 * Usage: node scripts/audit-gate.mjs [--evidence <file>]
 *   --evidence writes the raw `npm audit --json` output to <file> so CI can
 *   archive it (used by the exact-head proof workflow).
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const ALLOWLIST = {
  'GHSA-w3rx-r6r6-pgpr': {
    package: 'image-size',
    reason:
      'ICNS parser DoS. No patched release published; npm fix requires downgrading to Expo 53 / RN 0.72. App never parses user-supplied ICNS files.',
    expires: '2026-10-01',
  },
  'GHSA-5p2g-fcmc-qvqq': {
    package: 'image-size',
    reason:
      'JXL/HEIF parser DoS. Same unpatched image-size chain via @expo/image-utils; only fix is a breaking Expo downgrade.',
    expires: '2026-10-01',
  },
};

const evidenceIdx = process.argv.indexOf('--evidence');
const evidencePath = evidenceIdx > -1 ? process.argv[evidenceIdx + 1] : null;

const res = spawnSync('npm', ['audit', '--json'], {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
if (!res.stdout) {
  console.error('audit-gate: npm audit produced no output');
  console.error(res.stderr ?? '');
  process.exit(1);
}
if (evidencePath) writeFileSync(evidencePath, res.stdout);

let report;
try {
  report = JSON.parse(res.stdout);
} catch {
  console.error('audit-gate: could not parse npm audit --json output');
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const advisories = new Map();
for (const vuln of Object.values(report.vulnerabilities ?? {})) {
  if (vuln.severity !== 'high' && vuln.severity !== 'critical') continue;
  for (const via of vuln.via ?? []) {
    if (typeof via !== 'object' || !via.url) continue;
    const id = via.url.split('/').pop();
    advisories.set(id, { name: via.name, title: via.title, severity: via.severity });
  }
}

const blocked = [];
const allowed = [];
for (const [id, adv] of advisories) {
  const entry = ALLOWLIST[id];
  if (!entry) {
    blocked.push(`${id} (${adv.name}, ${adv.severity}): ${adv.title}`);
  } else if (entry.expires < today) {
    blocked.push(`${id} (${adv.name}): allowlist entry EXPIRED ${entry.expires} — re-review required`);
  } else {
    allowed.push(`${id} (${adv.name}): allowlisted until ${entry.expires} — ${entry.reason}`);
  }
}

for (const line of allowed) console.log(`audit-gate ALLOW: ${line}`);
if (blocked.length > 0) {
  for (const line of blocked) console.error(`audit-gate BLOCK: ${line}`);
  console.error(`audit-gate: ${blocked.length} high/critical advisories block this build`);
  process.exit(1);
}
console.log(
  `audit-gate: pass (${advisories.size} high/critical advisories, all allowlisted; moderate and below not gated)`
);
