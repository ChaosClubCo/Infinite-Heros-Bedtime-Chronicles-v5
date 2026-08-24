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
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const ALLOWLIST = {
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

/**
 * Extracts high and critical advisories from an npm audit JSON report.
 * @param {object} report - Parsed npm audit JSON object
 * @returns {Map<string, { name: string, title: string, severity: string }>}
 */
export function parseAdvisories(report) {
  const advisories = new Map();
  for (const vuln of Object.values(report?.vulnerabilities ?? {})) {
    if (vuln.severity !== 'high' && vuln.severity !== 'critical') continue;
    for (const via of vuln.via ?? []) {
      if (typeof via !== 'object' || !via.url) continue;
      const id = via.url.split('/').pop();
      advisories.set(id, { name: via.name, title: via.title, severity: via.severity });
    }
  }
  return advisories;
}

/**
 * Evaluates audit findings against the allowlist and expiration dates.
 * @param {object} report - Parsed npm audit JSON report
 * @param {object} allowlist - Allowlist dictionary
 * @param {string} today - ISO date string (YYYY-MM-DD)
 * @returns {{ ok: boolean, blocked: string[], allowed: string[], advisoryCount: number }}
 */
export function evaluateAuditReport(
  report,
  allowlist = ALLOWLIST,
  today = new Date().toISOString().slice(0, 10)
) {
  const advisories = parseAdvisories(report);
  const blocked = [];
  const allowed = [];

  for (const [id, adv] of advisories) {
    const entry = allowlist[id];
    if (!entry) {
      blocked.push(`${id} (${adv.name}, ${adv.severity}): ${adv.title}`);
    } else if (entry.expires < today) {
      blocked.push(`${id} (${adv.name}): allowlist entry EXPIRED ${entry.expires} — re-review required`);
    } else {
      allowed.push(`${id} (${adv.name}): allowlisted until ${entry.expires} — ${entry.reason}`);
    }
  }

  return {
    ok: blocked.length === 0,
    blocked,
    allowed,
    advisoryCount: advisories.size,
  };
}

/**
 * Runs the npm audit process and evaluates the output.
 * @param {string[]} argv - Command line arguments
 * @returns {{ ok: boolean, blocked: string[], allowed: string[], advisoryCount: number }}
 */
export function runAuditGate(argv = process.argv) {
  const evidenceIdx = argv.indexOf('--evidence');
  const evidencePath = evidenceIdx > -1 ? argv[evidenceIdx + 1] : null;

  const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const res = spawnSync(npmExecutable, ['audit', '--json'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    shell: process.platform === 'win32',
  });

  if (!res.stdout) {
    console.error('audit-gate: npm audit produced no output');
    console.error(res.stderr ?? '');
    return { ok: false, blocked: ['npm audit execution failed or produced no output'], allowed: [], advisoryCount: 0 };
  }

  if (evidencePath) {
    writeFileSync(evidencePath, res.stdout);
  }

  let report;
  try {
    report = JSON.parse(res.stdout);
  } catch {
    console.error('audit-gate: could not parse npm audit --json output');
    return { ok: false, blocked: ['Could not parse npm audit JSON output'], allowed: [], advisoryCount: 0 };
  }

  const evaluation = evaluateAuditReport(report);

  for (const line of evaluation.allowed) {
    console.log(`audit-gate ALLOW: ${line}`);
  }

  if (evaluation.blocked.length > 0) {
    for (const line of evaluation.blocked) {
      console.error(`audit-gate BLOCK: ${line}`);
    }
    console.error(`audit-gate: ${evaluation.blocked.length} high/critical advisories block this build`);
  } else {
    console.log(
      `audit-gate: pass (${evaluation.advisoryCount} high/critical advisories, all allowlisted; moderate and below not gated)`
    );
  }

  return evaluation;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(__filename)) {
  const result = runAuditGate(process.argv);
  process.exit(result.ok ? 0 : 1);
}
