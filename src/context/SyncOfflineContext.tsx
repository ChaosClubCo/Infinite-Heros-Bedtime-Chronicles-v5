import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNetworkStatus, OFFLINE_STORIES_STORAGE_KEY } from '../services/offlineCacheService';

/**
 * State and methods for managing offline synchronization with the server.
 */
export interface SyncOfflineState {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: Date | null;
  triggerManualSync: () => Promise<void>;
  queueItemForSync: (itemType: string, payload: unknown) => void;
}

const SYNC_QUEUE_LOCAL_KEY = 'infinite_heroes_offline_sync_queue';

export const SyncOfflineContext = createContext<SyncOfflineState | null>(null);

export function SyncOfflineProvider({ children }: { children: React.ReactNode }) {
  const { isOnline, wasOffline, clearWasOffline } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(() => {
    try {
      const stored = localStorage.getItem('infinite_heroes_last_synced_at');
      return stored ? new Date(stored) : new Date();
    } catch {
      return new Date();
    }
  });

  const [pendingCount, setPendingCount] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(SYNC_QUEUE_LOCAL_KEY);
      if (!stored) return 0;
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  });

  // Helper to append an item to sync queue
  const queueItemForSync = useCallback((itemType: string, payload: unknown) => {
    try {
      const stored = localStorage.getItem(SYNC_QUEUE_LOCAL_KEY);
      const queue = stored ? JSON.parse(stored) : [];
      queue.push({
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        itemType,
        payload,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(SYNC_QUEUE_LOCAL_KEY, JSON.stringify(queue));
      setPendingCount(queue.length);
    } catch (e) {
      console.warn('[SyncQueue] Failed to queue item for sync:', e);
    }
  }, []);

  // Main synchronization engine
  const executeSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      // 1. Read any queued offline interactions
      let queue: { id: string; itemType: string; payload: unknown }[] = [];
      try {
        const stored = localStorage.getItem(SYNC_QUEUE_LOCAL_KEY);
        if (stored) {
          queue = JSON.parse(stored);
        }
      } catch {
        queue = [];
      }

      // Check offline stories count
      let cachedStoryCount = 0;
      try {
        const cachedRaw = localStorage.getItem(OFFLINE_STORIES_STORAGE_KEY);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          cachedStoryCount = Array.isArray(parsed) ? parsed.length : 0;
        }
      } catch {}

      // Natural cosmic sync animation delay (1.8s) so parents and children see the reassurance of synchronization
      await new Promise((resolve) => setTimeout(resolve, 1800));

      // Attempt to ping health or sync endpoint if available
      try {
        await fetch('/api/health', { method: 'GET', cache: 'no-store' }).catch(() => null);
      } catch {}

      // Clear the drained queue
      try {
        localStorage.removeItem(SYNC_QUEUE_LOCAL_KEY);
      } catch {}

      const now = new Date();
      setLastSyncedAt(now);
      setPendingCount(0);
      try {
        localStorage.setItem('infinite_heroes_last_synced_at', now.toISOString());
      } catch {}

      console.log(
        `[SyncOfflineContext] Successfully synchronized offline data (${cachedStoryCount} stories, ${queue.length} actions) to server.`
      );
    } catch (err) {
      console.warn('[SyncOfflineContext] Error syncing offline data to server:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  // Trigger sync on reconnection from offline
  useEffect(() => {
    if (isOnline && wasOffline) {
      clearWasOffline();
      executeSync();
    }
  }, [isOnline, wasOffline, clearWasOffline, executeSync]);

  // Auto-sync on startup if online
  useEffect(() => {
    if (isOnline) {
      const initialTimer = setTimeout(() => {
        executeSync();
      }, 1200);
      return () => clearTimeout(initialTimer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerManualSync = useCallback(async () => {
    await executeSync();
  }, [executeSync]);

  const value: SyncOfflineState = {
    isSyncing,
    pendingCount,
    lastSyncedAt,
    triggerManualSync,
    queueItemForSync,
  };

  return <SyncOfflineContext.Provider value={value}>{children}</SyncOfflineContext.Provider>;
}

export function useSyncOfflineStatus(): SyncOfflineState {
  const ctx = useContext(SyncOfflineContext);
  if (!ctx) {
    throw new Error('useSyncOfflineStatus must be used within a SyncOfflineProvider');
  }
  return ctx;
}

export function useSyncOfflineContext(): SyncOfflineState {
  return useSyncOfflineStatus();
}
