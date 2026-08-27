import { useState, useEffect } from "react";
import { useNetworkStatus } from "./useNetworkStatus";
import { getQueuedInteractions, syncOfflineInteractions } from "./sync-queue";
import { useQueryClient } from "@tanstack/react-query";

export function useSyncOffline() {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  // isInternetReachable is tri-state (null while NetInfo is still probing), so
  // only treat an explicit `false` as offline - null/true both allow a sync attempt.
  const isOnline = isConnected && isInternetReachable !== false;

  useEffect(() => {
    if (!isOnline) return;

    // Trigger sync when online (either on startup, when connectivity is restored,
    // or when reachability flips true without a connectivity bounce)
    const executeSync = async () => {
      try {
        const queued = await getQueuedInteractions();
        if (queued.length === 0) return;

        setIsSyncing(true);

        // 1.5-second artificial delay so children can enjoy the beautiful cosmic syncing flow/animation
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
  }, [isOnline, queryClient]);

  return { isSyncing };
}
