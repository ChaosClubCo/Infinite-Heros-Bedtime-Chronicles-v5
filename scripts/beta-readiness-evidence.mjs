import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';

export const SHA_PATTERN = /^[0-9a-f]{40}$/;
export const VALID_STATUSES = new Set(['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN']);

export function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

export async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

export function resolveInside(root, relativePath) {
  if (!relativePath || isAbsolute(relativePath)) {
    throw new Error(`evidence path must be relative: ${JSON.stringify(relativePath)}`);
  }
  const rootPath = resolve(root);
  const target = resolve(rootPath, relativePath);
  const rel = relative(rootPath, target);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`evidence path escapes its root: ${relativePath}`);
  }
  return target;
}

export function computeDecision(manifest) {
  const mandatoryBlocked = manifest.gates.some(
    (gate) => gate.mandatory === true && gate.status !== 'PASS',
  );
  const defects = manifest.defects;
  const defectReceiptMissing = manifest.policy.requireDefectReceipt && defects?.receipt == null;
  const defectThresholdExceeded =
    !Number.isInteger(defects?.openP0) ||
    !Number.isInteger(defects?.openP1) ||
    defects.openP0 > manifest.policy.maxOpenP0 ||
    defects.openP1 > manifest.policy.maxOpenP1;
  return mandatoryBlocked || defectReceiptMissing || defectThresholdExceeded ? 'BLOCKED' : 'PASS';
}

export async function validateReceiptReference(reference, expected, evidenceDir, now, maxAgeHours) {
  const receiptPath = resolveInside(evidenceDir, reference.path);
  const bytes = await readFile(receiptPath);
  if (sha256(bytes) !== reference.sha256) {
    throw new Error(`${expected.id}: receipt digest mismatch`);
  }
  const receipt = JSON.parse(bytes.toString('utf8'));
  if (receipt.gateId !== expected.id || receipt.candidateSha !== expected.candidateSha) {
    throw new Error(`${expected.id}: receipt is not bound to the manifest candidate`);
  }
  if (!VALID_STATUSES.has(receipt.status) || receipt.status !== expected.status) {
    throw new Error(`${expected.id}: receipt status disagrees with the manifest`);
  }
  if (typeof receipt.source?.provider !== 'string' || typeof receipt.source?.uri !== 'string') {
    throw new Error(`${expected.id}: receipt source provider and uri are required`);
  }
  const executedAt = Date.parse(receipt.executedAt);
  if (!Number.isFinite(executedAt) || executedAt > now.getTime() + 300_000) {
    throw new Error(`${expected.id}: receipt executedAt is invalid or in the future`);
  }
  if (now.getTime() - executedAt > maxAgeHours * 3_600_000) {
    throw new Error(`${expected.id}: receipt is older than ${maxAgeHours} hours`);
  }
  return receipt;
}

export async function validateManifest(manifest, options) {
  const errors = [];
  const { currentHead, evidenceDir, template, templateSha256, now = new Date() } = options;
  if (manifest.kind !== 'BetaAcceptanceManifest/v2') errors.push('unexpected manifest kind');
  if (manifest.repository !== template.repository) errors.push('repository disagrees with policy template');
  if (!SHA_PATTERN.test(manifest.candidate?.sha ?? '')) errors.push('candidate.sha must be a full SHA');
  if (manifest.candidate?.sha !== currentHead) errors.push('candidate.sha does not equal the checked-out HEAD');
  if (manifest.policyTemplate?.sha256 !== templateSha256) errors.push('policy template digest mismatch');
  if (!Array.isArray(manifest.gates) || manifest.gates.length === 0) errors.push('manifest.gates is empty');
  if (JSON.stringify(manifest.policy) !== JSON.stringify(template.policy)) {
    errors.push('manifest policy disagrees with policy template');
  }

  const expectedGates = new Map(template.gates.map((gate) => [gate.id, gate]));
  if (expectedGates.size !== template.gates.length || manifest.gates?.length !== template.gates.length) {
    errors.push('manifest gate set disagrees with policy template');
  }

  const maxAgeHours = Number(manifest.policy?.receiptMaxAgeHours);
  if (!Number.isFinite(maxAgeHours) || maxAgeHours <= 0) errors.push('invalid receiptMaxAgeHours');

  const seenGateIds = new Set();
  for (const gate of manifest.gates ?? []) {
    if (seenGateIds.has(gate.id)) errors.push(`${gate.id}: duplicate gate id`);
    seenGateIds.add(gate.id);
    const expectedGate = expectedGates.get(gate.id);
    if (
      expectedGate == null ||
      gate.name !== expectedGate.name ||
      gate.mandatory !== expectedGate.mandatory
    ) {
      errors.push(`${gate.id}: gate definition disagrees with policy template`);
    }
    if (!VALID_STATUSES.has(gate.status)) {
      errors.push(`${gate.id}: invalid status`);
      continue;
    }
    if (gate.status === 'NOT_RUN') {
      if (gate.receipt != null) errors.push(`${gate.id}: NOT_RUN gate must not carry a receipt`);
      continue;
    }
    if (gate.receipt == null) {
      errors.push(`${gate.id}: ${gate.status} gate is missing a receipt`);
      continue;
    }
    try {
      await validateReceiptReference(
        gate.receipt,
        { id: gate.id, status: gate.status, candidateSha: manifest.candidate.sha },
        evidenceDir,
        now,
        maxAgeHours,
      );
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (manifest.defects?.receipt != null) {
    try {
      const reference = manifest.defects.receipt;
      const bytes = await readFile(resolveInside(evidenceDir, reference.path));
      if (sha256(bytes) !== reference.sha256) throw new Error('defect receipt digest mismatch');
      const receipt = JSON.parse(bytes.toString('utf8'));
      if (receipt.candidateSha !== manifest.candidate.sha) throw new Error('defect receipt candidate mismatch');
      if (receipt.openP0 !== manifest.defects.openP0 || receipt.openP1 !== manifest.defects.openP1) {
        throw new Error('defect counts disagree with receipt');
      }
      if (typeof receipt.source?.provider !== 'string' || typeof receipt.source?.uri !== 'string') {
        throw new Error('defect receipt source provider and uri are required');
      }
      const executedAt = Date.parse(receipt.executedAt);
      if (
        !Number.isFinite(executedAt) ||
        executedAt > now.getTime() + 300_000 ||
        now.getTime() - executedAt > maxAgeHours * 3_600_000
      ) {
        throw new Error(`defect receipt is invalid or older than ${maxAgeHours} hours`);
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  const computedDecision = computeDecision(manifest);
  if (manifest.decision !== computedDecision) errors.push(`decision must be ${computedDecision}`);
  return { ok: errors.length === 0, errors, computedDecision };
}
