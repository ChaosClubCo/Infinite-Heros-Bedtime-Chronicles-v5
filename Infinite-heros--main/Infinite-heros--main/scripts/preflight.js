#!/usr/bin/env node
// scripts/preflight.js — Pre-deployment sanity checks
// Run: node scripts/preflight.js
// Exits 1 on any failure so CI and local devs get a clear signal before deployment.

import { readFileSync, readdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const require = createRequire(import.meta.url);

let failures = 0;

function fail(msg) {
  console.error(`  ✗ FAIL: ${msg}`);
  failures++;
}

function pass(msg) {
  console.log(`  ✓ ${msg}`);
}

function section(title) {
  console.log(`\n[preflight] ${title}`);
}

// ---------------------------------------------------------------------------
// 1. Node version
// ---------------------------------------------------------------------------
section('Node.js version');
const [nodeMajor] = process.versions.node.split('.').map(Number);
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const enginesRange = pkg.engines?.node ?? '>=0';
const minMatch = enginesRange.match(/>=(\d+)/);
const minNode = minMatch ? parseInt(minMatch[1], 10) : 0;

if (nodeMajor < minNode) {
  fail(`Node ${process.versions.node} is below the required ${enginesRange}. Install Node ${minNode}+.`);
} else {
  pass(`Node ${process.versions.node} satisfies ${enginesRange}`);
}

// ---------------------------------------------------------------------------
// 2. Lockfile / npm version alignment
// ---------------------------------------------------------------------------
section('Lockfile integrity');
const lockPath = join(root, 'package-lock.json');
if (!existsSync(lockPath)) {
  fail('package-lock.json is missing. Run `npm install` to generate it and commit it.');
} else {
  try {
    const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
    if (lock.lockfileVersion < 3) {
      fail(`package-lock.json is lockfileVersion ${lock.lockfileVersion}. Regenerate with npm v7+ for lockfileVersion 3.`);
    } else {
      pass(`package-lock.json present (lockfileVersion ${lock.lockfileVersion})`);
    }
  } catch {
    fail('package-lock.json is not valid JSON.');
  }
}

// ---------------------------------------------------------------------------
// 3. Patch-package: every file in patches/ must match the installed version
// ---------------------------------------------------------------------------
section('Patch file consistency');
const patchesDir = join(root, 'patches');
if (existsSync(patchesDir)) {
  const patchFiles = readdirSync(patchesDir).filter((f) => f.endsWith('.patch'));
  if (patchFiles.length === 0) {
    pass('No patch files — nothing to validate');
  } else {
    for (const patchFile of patchFiles) {
      // patch-package filenames: <pkg-name>+<version>.patch (scoped: @scope+name+version.patch)
      const withoutExt = patchFile.replace(/\.patch$/, '');
      // Split on '+' to get parts; last part is version, rest reassemble to pkg name
      const parts = withoutExt.split('+');
      if (parts.length < 2) {
        fail(`Cannot parse version from patch filename: ${patchFile}`);
        continue;
      }
      const patchedVersion = parts[parts.length - 1];
      // Reconstruct npm package name.
      // patch-package encodes scoped packages as: @scope+name+version.patch
      // so @scope+name needs the first '+' replaced with '/' to get @scope/name.
      let pkgName;
      if (withoutExt.startsWith('@')) {
        const nameRaw = parts.slice(0, -1).join('+'); // e.g. "@scope+name"
        pkgName = nameRaw.replace('+', '/');           // "@scope/name"
      } else {
        pkgName = parts.slice(0, -1).join('+');
      }

      try {
        const installedPkgPath = join(root, 'node_modules', pkgName, 'package.json');
        if (!existsSync(installedPkgPath)) {
          fail(`Patch targets ${pkgName}@${patchedVersion} but the package is not installed. Remove ${patchFile} or install the package.`);
          continue;
        }
        const installedPkg = JSON.parse(readFileSync(installedPkgPath, 'utf8'));
        if (installedPkg.version !== patchedVersion) {
          fail(
            `Patch ${patchFile} targets ${pkgName}@${patchedVersion} but ${installedPkg.version} is installed. ` +
              `Update the patch for the installed version or delete it if no longer needed.`,
          );
        } else {
          pass(`Patch ${patchFile} matches installed ${pkgName}@${installedPkg.version}`);
        }
      } catch (err) {
        fail(`Error reading patch target ${pkgName}: ${err.message}`);
      }
    }
  }
} else {
  pass('No patches/ directory — skipping patch validation');
}

// ---------------------------------------------------------------------------
// 4. Required environment variables
// ---------------------------------------------------------------------------
section('Required environment variables');

// At minimum one AI text provider key must be present for story generation.
const aiProviderKeys = [
  'AI_INTEGRATIONS_GEMINI_API_KEY',
  'AI_INTEGRATIONS_OPENAI_API_KEY',
  'AI_INTEGRATIONS_ANTHROPIC_API_KEY',
  'AI_INTEGRATIONS_OPENROUTER_API_KEY',
];
const missingAiKeys = aiProviderKeys.filter((k) => !process.env[k]);
if (missingAiKeys.length === aiProviderKeys.length) {
  const msg =
    'No AI provider key is set. At least one of the following must be configured in Vercel Environment Variables:\n' +
    aiProviderKeys.map((k) => `    • ${k}`).join('\n');
  if (process.env.CI) {
    // In CI there are no runtime env vars — this is expected. Warn only.
    console.warn(`  ⚠  WARN: ${msg}`);
  } else {
    fail(msg);
  }
} else {
  const present = aiProviderKeys.filter((k) => !!process.env[k]);
  pass(`AI provider key(s) present: ${present.join(', ')}`);
}

// These warn but do not fail — they enable optional features.
const optionalKeys = [
  { key: 'ELEVENLABS_API_KEY', feature: 'TTS narration (optional — Replit connector fallback available)' },
  { key: 'DATABASE_URL', feature: 'Voice chat / conversation history' },
  { key: 'OPENAI_API_KEY', feature: 'Video generation via Sora' },
];
for (const { key, feature } of optionalKeys) {
  if (!process.env[key]) {
    console.warn(`  ⚠  WARN: ${key} is not set — ${feature} will be disabled`);
  } else {
    pass(`${key} is set`);
  }
}

// ---------------------------------------------------------------------------
// 5. Summary
// ---------------------------------------------------------------------------
console.log('');
if (failures > 0) {
  console.error(`[preflight] ✗ ${failures} check(s) FAILED — fix the issues above before deploying.\n`);
  process.exit(1);
} else {
  console.log('[preflight] ✓ All checks passed — safe to deploy.\n');
}
