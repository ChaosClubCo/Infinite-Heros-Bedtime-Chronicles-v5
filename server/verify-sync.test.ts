import { describe, it, expect } from 'vitest';
import { verifySyncEngine } from '../scripts/verify-sync';

describe('scripts/verify-sync', () => {
  it('executes cloud sync end-to-end verification successfully', () => {
    const result = verifySyncEngine(true);

    expect(result.mappersValid).toBe(true);
    expect(result.reconciliationValid).toBe(true);
    expect(result.summary.storyStrippedImages).toBe(true);
    expect(result.summary.storyRestored).toBe(true);
    expect(result.summary.badgeRestored).toBe(true);
    expect(result.summary.streakRestored).toBe(true);
    expect(result.summary.profileStubPiiFree).toBe(true);
    expect(result.summary.localAppliedCount).toBe(1);
    expect(result.summary.remotePushedCount).toBe(1);
  });
});
