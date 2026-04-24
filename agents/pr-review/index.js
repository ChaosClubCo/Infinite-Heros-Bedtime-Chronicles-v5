#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = process.cwd();
const config = JSON.parse(fs.readFileSync(path.join(root, 'agents/pr-review/.agentrc.json'), 'utf8'));

function getArg(name, fallback) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && process.argv[idx + 1]) {
    return process.argv[idx + 1];
  }
  return fallback;
}

const base = getArg('base', process.env.BASE_SHA || 'HEAD~1');
const head = getArg('head', process.env.HEAD_SHA || 'HEAD');
const jsonOutput = getArg('output', 'agents/pr-review/pr-review-report.json');
const markdownOutput = getArg('markdown', 'agents/pr-review/pr-review.md');

function runGit(args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(result.stderr || `git ${args.join(' ')} failed`);
  }
  return result.stdout.trim();
}

const diffRange = `${base}...${head}`;
const changedFilesRaw = runGit(['diff', '--name-only', diffRange]);
const changedFiles = changedFilesRaw ? changedFilesRaw.split('\n').filter(Boolean) : [];

const numstatRaw = runGit(['diff', '--numstat', diffRange]);
let additions = 0;
let deletions = 0;
for (const line of numstatRaw.split('\n').filter(Boolean)) {
  const [add, del] = line.split('\t');
  const addParsed = Number(add);
  const delParsed = Number(del);
  const addNum = Number.isNaN(addParsed) ? 0 : addParsed;
  const delNum = Number.isNaN(delParsed) ? 0 : delParsed;
  additions += addNum;
  deletions += delNum;
}

const highRiskTouched = changedFiles.filter((file) =>
  config.highRiskPaths.some((candidate) => file === candidate || file.startsWith(candidate))
);

const totalChangedLines = additions + deletions;
const isLargePr =
  changedFiles.length >= config.largePrThreshold.files ||
  totalChangedLines >= config.largePrThreshold.changedLines;

const riskLevel = highRiskTouched.length > 0 || isLargePr ? 'high' : totalChangedLines > 250 ? 'medium' : 'low';

const report = {
  generatedAt: new Date().toISOString(),
  base,
  head,
  filesChanged: changedFiles.length,
  additions,
  deletions,
  totalChangedLines,
  highRiskTouched,
  isLargePr,
  riskLevel,
  changedFiles,
};

const markdown = [
  `${config.commentMarker}`,
  '## PR Review Agent Summary',
  '',
  `- **Risk level:** ${riskLevel.toUpperCase()}`,
  `- **Files changed:** ${changedFiles.length}`,
  `- **Lines changed:** +${additions} / -${deletions} (total ${totalChangedLines})`,
  `- **Large PR threshold hit:** ${isLargePr ? 'Yes' : 'No'}`,
  '',
  '### High-risk files touched',
  highRiskTouched.length > 0
    ? highRiskTouched.map((file) => `- \`${file}\``).join('\n')
    : '- None',
  '',
  '### Top changed files',
  changedFiles.slice(0, 15).map((file) => `- \`${file}\``).join('\n') || '- None',
  '',
  '_Generated automatically by `agents/pr-review/index.js`._',
  '',
].join('\n');

fs.mkdirSync(path.dirname(path.join(root, jsonOutput)), { recursive: true });
fs.writeFileSync(path.join(root, jsonOutput), `${JSON.stringify(report, null, 2)}\n`);
fs.mkdirSync(path.dirname(path.join(root, markdownOutput)), { recursive: true });
fs.writeFileSync(path.join(root, markdownOutput), markdown);

console.log(`PR review report written to ${jsonOutput}`);
console.log(`PR review markdown written to ${markdownOutput}`);
