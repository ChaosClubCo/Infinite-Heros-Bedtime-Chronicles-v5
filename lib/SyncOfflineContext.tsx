import React, { createContext, useContext } from "react";
import { useSyncOffline } from "@/lib/useSyncOffline";

/**
 * Mounts lib/useSyncOffline.ts's reconnect-drain effect exactly once at the
 * app root and shares its { isSyncing, lastSyncCount } state with any screen
 * that wants a syncing indicator. Screens must not call useSyncOffline()
 * directly - multiple independent instances can each read the same queue on
 * reconnect and race to POST the same batch before any of them clears it.
 */
interface SyncOfflineState {
  isSyncing: boolean;
  lastSyncCount: number;
}

const SyncOfflineContext = createContext<SyncOfflineState | null>(null);

export function SyncOfflineProvider({ children }: { children: React.ReactNode }) {
  const value = useSyncOffline();
  return <SyncOfflineContext.Provider value={value}>{children}</SyncOfflineContext.Provider>;
}

export function useSyncOfflineStatus(): SyncOfflineState {
  const ctx = useContext(SyncOfflineContext);
  if (!ctx) {
    throw new Error("useSyncOfflineStatus must be used within a SyncOfflineProvider");
  }
  return ctx;
}
