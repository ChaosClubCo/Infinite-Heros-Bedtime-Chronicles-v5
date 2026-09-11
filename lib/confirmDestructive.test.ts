import { describe, it, expect, vi } from 'vitest';
import { confirmDestructive, notifyResult } from './confirmDestructive';

describe('Cross-Platform Destructive Action Confirmation', () => {
  it('calls confirm handler when window.confirm returns true on web', () => {
    const originalWindow = global.window;
    const confirmMock = vi.fn().mockReturnValue(true);
    // @ts-ignore
    global.window = { confirm: confirmMock, alert: vi.fn() };

    const onConfirm = vi.fn();
    confirmDestructive('Delete Profile', 'Are you sure?', 'Delete', onConfirm);

    expect(confirmMock).toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalled();

    global.window = originalWindow;
  });

  it('does not invoke callback when window.confirm returns false on web', () => {
    const originalWindow = global.window;
    const confirmMock = vi.fn().mockReturnValue(false);
    // @ts-ignore
    global.window = { confirm: confirmMock, alert: vi.fn() };

    const onConfirm = vi.fn();
    confirmDestructive('Delete Story', 'Are you sure?', 'Delete', onConfirm);

    expect(confirmMock).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();

    global.window = originalWindow;
  });

  it('notifies result via alert dialog and triggers onDismiss callback', () => {
    const originalWindow = global.window;
    const alertMock = vi.fn();
    // @ts-ignore
    global.window = { alert: alertMock };

    const onDismiss = vi.fn();
    notifyResult('Notice', 'Data Cleared', onDismiss);

    expect(alertMock).toHaveBeenCalledWith('Notice\n\nData Cleared');
    expect(onDismiss).toHaveBeenCalled();

    global.window = originalWindow;
  });
});
