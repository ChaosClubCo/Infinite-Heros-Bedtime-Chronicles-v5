import React from 'react';
import { render, act } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { SyncManager } from '@/components/SyncManager';
import { runSync } from '@/lib/sync/runSync';
import { useSettings } from '@/lib/SettingsContext';
import { useNetworkStatus } from '@/lib/useNetworkStatus';
import { useProfile } from '@/lib/ProfileContext';
import { useAuth } from '@/lib/AuthContext';

// SyncManager is pure trigger wiring — mock everything it consumes and assert
// when it calls runSync. runSync itself is exercised by lib/sync/runSync.test.ts.
jest.mock('@/lib/sync/runSync', () => ({ runSync: jest.fn() }));
jest.mock('@/lib/SettingsContext', () => ({ useSettings: jest.fn() }));
jest.mock('@/lib/useNetworkStatus', () => ({ useNetworkStatus: jest.fn() }));
jest.mock('@/lib/ProfileContext', () => ({ useProfile: jest.fn() }));
jest.mock('@/lib/AuthContext', () => ({ useAuth: jest.fn() }));

const mockedRunSync = runSync as jest.MockedFunction<typeof runSync>;
const mockedUseSettings = useSettings as jest.Mock;
const mockedUseNetwork = useNetworkStatus as jest.Mock;
const mockedUseProfile = useProfile as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;

const refreshProfiles = jest.fn().mockResolvedValue(undefined);

interface HookOpts {
  enabled?: boolean;
  online?: boolean;
  user?: { id: string } | null;
}

function setHooks({ enabled = true, online = true, user = { id: 'u1' } }: HookOpts = {}) {
  mockedUseSettings.mockReturnValue({ settings: { cloudSyncEnabled: enabled } });
  // isOnline = isConnected && isInternetReachable !== false
  mockedUseNetwork.mockReturnValue({ isConnected: online, isInternetReachable: online });
  mockedUseProfile.mockReturnValue({ refreshProfiles });
  mockedUseAuth.mockReturnValue({ user });
}

let changeHandler: ((s: AppStateStatus) => void) | undefined;

beforeEach(() => {
  jest.clearAllMocks();
  // The component does `runSync(true).then(...)`, so the mock must resolve.
  mockedRunSync.mockResolvedValue(true);
  changeHandler = undefined;
  // Capture the AppState "change" listener so tests can simulate foregrounding.
  jest.spyOn(AppState, 'addEventListener').mockImplementation((type, handler) => {
    if (type === 'change') changeHandler = handler as (s: AppStateStatus) => void;
    return { remove: jest.fn() } as ReturnType<typeof AppState.addEventListener>;
  });
});

describe('SyncManager', () => {
  it('syncs on mount when enabled and online', async () => {
    setHooks({ enabled: true, online: true });
    await render(<SyncManager />);
    expect(mockedRunSync).toHaveBeenCalledWith(true);
  });

  it('does not sync on mount when cloud sync is disabled', async () => {
    setHooks({ enabled: false, online: true });
    await render(<SyncManager />);
    expect(mockedRunSync).not.toHaveBeenCalled();
  });

  it('does not sync on mount when offline', async () => {
    setHooks({ enabled: true, online: false });
    await render(<SyncManager />);
    expect(mockedRunSync).not.toHaveBeenCalled();
  });

  it('syncs when connectivity is regained', async () => {
    setHooks({ enabled: true, online: false });
    const { rerender } = await render(<SyncManager />);
    expect(mockedRunSync).not.toHaveBeenCalled();

    setHooks({ enabled: true, online: true });
    await act(async () => {
      rerender(<SyncManager />);
    });
    expect(mockedRunSync).toHaveBeenCalledWith(true);
  });

  it('syncs when the app returns to the foreground', async () => {
    setHooks({ enabled: true, online: true });
    await render(<SyncManager />);
    mockedRunSync.mockClear();

    await act(async () => {
      changeHandler?.('active');
    });
    expect(mockedRunSync).toHaveBeenCalledWith(true);
  });

  it('does not sync on foreground when disabled', async () => {
    setHooks({ enabled: false, online: true });
    await render(<SyncManager />);
    mockedRunSync.mockClear();

    await act(async () => {
      changeHandler?.('active');
    });
    expect(mockedRunSync).not.toHaveBeenCalled();
  });

  it('syncs again when the user signs in while foregrounded', async () => {
    setHooks({ enabled: true, online: true, user: null });
    const { rerender } = await render(<SyncManager />);
    expect(mockedRunSync).toHaveBeenCalledTimes(1); // mount

    // Sign-in: user id goes null -> "u1"; the user?.id dep re-runs the effect.
    setHooks({ enabled: true, online: true, user: { id: 'u1' } });
    await act(async () => {
      rerender(<SyncManager />);
    });
    expect(mockedRunSync).toHaveBeenCalledTimes(2);
  });
});
