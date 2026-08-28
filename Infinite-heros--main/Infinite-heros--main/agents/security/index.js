#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = process.cwd();
const configPath = path.join(root, 'agents/security/.agentrc.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const outputFlag = process.argv.indexOf('--output');
const outputPath =
  outputFlag >= 0 && process.argv[outputFlag + 1]
    ? process.argv[outputFlag + 1]
    : 'agents/security/security-report.json';

const ignoreSet = new Set(config.ignoreDirectories || []);
const parsedMaxSize = Number.parseInt(String(config.maxFileSizeBytes ?? 1048576), 10);
const maxFileSizeBytes = Number.isFinite(parsedMaxSize) && parsedMaxSize > 0 ? parsedMaxSize : 1048576;
const patterns = (config.secretPatterns || []).map((pattern) => ({
  id: pattern.id,
  regex: new RegExp(pattern.regex, 'gi'),
}));
const ignoreExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.mp3', '.mp4', '.ico']);
const ignoreGlobs = config.ignoreGlobs || [];

function shouldIgnoreByGlob(relPath) {
  return ignoreGlobs.some((globPattern) => {
    if (globPattern === '**/*.md') {
      return relPath.endsWith('.md');
    }
    if (globPattern === '**/*.test.ts') {
      return relPath.endsWith('.test.ts');
    }
    if (globPattern === '**/*.spec.ts') {
      return relPath.endsWith('.spec.ts');
    }
    return false;
  });
}

function isTextContent(buffer) {
  return !buffer.includes(0);
}

function walkDirectory(dirPath, files) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.relative(root, fullPath);
    const parts = relPath.split(path.sep);
    if (parts.some((part) => ignoreSet.has(part))) {
      continue;
    }

    if (entry.isDirectory()) {
      walkDirectory(fullPath, files);
      continue;
    }

    if (entry.isFile()) {
      if (ignoreExtensions.has(path.extname(entry.name).toLowerCase())) {
        continue;
      }
      if (shouldIgnoreByGlob(relPath)) {
        continue;
      }
      files.push(fullPath);
    }
  }
}

function scanSecrets(files) {
  const findings = [];

  for (const filePath of files) {
    let stats;
    try {
      stats = fs.statSync(filePath);
    } catch {
      continue;
    }

    if (stats.size > maxFileSizeBytes) {
      continue;
    }

    let buffer;
    try {
      buffer = fs.readFileSync(filePath);
    } catch {
      continue;
    }

    if (!isTextContent(buffer)) {
      continue;
    }

    const content = buffer.toString('utf8');
    for (const pattern of patterns) {
      pattern.regex.lastIndex = 0;
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        findings.push({
          file: path.relative(root, filePath),
          patternId: pattern.id,
          snippet: match[0].slice(0, 80),
        });
      }
    }
  }

  return findings;
}

function runAudit() {
  const level = config.auditLevel || 'high';
  const result = spawnSync('npm', ['audit', '--omit=dev', `--audit-level=${level}`, '--json'], {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
  });

  let parsed = null;
  if (result.stdout) {
    try {
      parsed = JSON.parse(result.stdout);
    } catch {
      parsed = null;
    }
  }

  return {
    passed: result.status === 0,
    exitCode: result.status,
    error: result.error ? String(result.error.message || result.error) : null,
    summary: parsed
      ? {
          vulnerabilities: parsed.metadata?.vulnerabilities || {},
          totalDependencies: parsed.metadata?.totalDependencies,
        }
      : null,
  };
}

const fileList = [];
walkDirectory(root, fileList);
const secretFindings = scanSecrets(fileList);
const auditResult = runAudit();

const report = {
  generatedAt: new Date().toISOString(),
  audit: auditResult,
  secretScan: {
    findingsCount: secretFindings.length,
    findings: secretFindings,
  },
  passed: auditResult.passed && secretFindings.length === 0,
};

fs.mkdirSync(path.dirname(path.join(root, outputPath)), { recursive: true });
fs.writeFileSync(path.join(root, outputPath), `${JSON.stringify(report, null, 2)}\n`);

console.log(`Security report written to ${outputPath}`);
console.log(`npm audit passed: ${auditResult.passed}`);
console.log(`Secret findings: ${secretFindings.length}`);

if (!report.passed) {
  process.exitCode = 1;
}
