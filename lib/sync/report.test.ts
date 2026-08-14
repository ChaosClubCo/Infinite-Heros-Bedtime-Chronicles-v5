import { describe, it, expect, vi } from 'vitest';
import { reportSyncError, setSyncErrorReporter, type SyncErrorReporter } from './report';

describe('Cloud Sync Error Reporter Utility', () => {
  it('invokes custom installed error reporter with context and error', () => {
    const customReporter: SyncErrorReporter = vi.fn();
    setSyncErrorReporter(customReporter);

    const testError = new Error('RLS Unauthorized');
    reportSyncError('syncAll:stories', testError, { retryCount: 2 });

    expect(customReporter).toHaveBeenCalledWith('syncAll:stories', testError, { retryCount: 2 });
  });

  it('swallows errors thrown by reporter to ensure sync never crashes', () => {
    const throwingReporter: SyncErrorReporter = () => {
      throw new Error('Reporter crashed');
    };
    setSyncErrorReporter(throwingReporter);

    expect(() => {
      reportSyncError('syncAll:badges', new Error('Network Error'));
    }).not.toThrow();
  });
});
