#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import {
  assertExpectedSha,
  readJson,
  sha256,
  validateManifest,
} from './beta-readiness-evidence.mjs';

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const manifestPath = resolve(option('--manifest', '.release-evidence/beta-acceptance-manifest.json'));
const templatePath = resolve(option('--template', 'docs/evidence/beta-acceptance-manifest.json'));
const evidenceDir = resolve(option('--evidence-dir', resolve(dirname(manifestPath), 'receipts')));
if (process.argv.includes('--sha')) {
  throw new Error('--sha is unsafe and unsupported; use --expected-sha as an assertion');
}
const gitHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const currentHead = assertExpectedSha(gitHead, option('--expected-sha'));

try {
  const [manifest, templateBytes] = await Promise.all([readJson(manifestPath), readFile(templatePath)]);
  const template = JSON.parse(templateBytes.toString('utf8'));
  const result = await validateManifest(manifest, {
    currentHead,
    evidenceDir,
    template,
    templateSha256: sha256(templateBytes),
  });
  console.log(JSON.stringify({ manifest: manifestPath, candidateSha: manifest.candidate?.sha, ...result }, null, 2));
  if (!result.ok || (result.computedDecision !== 'PASS' && !process.argv.includes('--allow-blocked'))) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`beta-readiness: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
