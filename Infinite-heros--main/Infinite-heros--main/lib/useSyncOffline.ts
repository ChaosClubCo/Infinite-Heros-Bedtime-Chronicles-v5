import { useState, useEffect, useRef } from "react";
import { useNetworkStatus } from "./useNetworkStatus";
import { getQueuedInteractions, syncOfflineInteractions } from "./sync-queue";
import { useQueryClient } from "@tanstack/react-query";

export function useSyncOffline() {
  const { isConnected } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncCount, setLastSyncCount] = useState(0);
  const wasOffline = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isConnected) {
      wasOffline.current = true;
      return;
    }

    // Trigger sync when connected (either on startup if online, or when connection is restored)
    const executeSync = async () => {
      try {
        const queued = await getQueuedInteractions();
        if (queued.length === 0) return;

        setIsSyncing(true);
        setLastSyncCount(queued.length);

        // 1.5-second artificial delay so children can enjoy the beautiful cosmic synching flow/animation
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const success = await syncOfflineInteractions();
        if (success) {
          // Invalidate React Query targets for fresh data mapping
          queryClient.invalidateQueries({ queryKey: ["stories"] });
          queryClient.invalidateQueries({ queryKey: ["favorites"] });
          queryClient.invalidateQueries({ queryKey: ["readStories"] });
        }
      } catch (error) {
        console.error("Connectivity restore sync error:", error);
      } finally {
        setIsSyncing(false);
      }
    };

    executeSync();
    wasOffline.current = false;
  }, [isConnected, queryClient]);

  return { isSyncing, lastSyncCount };
}
