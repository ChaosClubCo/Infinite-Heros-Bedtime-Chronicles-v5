import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useSettings } from "@/lib/SettingsContext";
import { useNetworkStatus } from "@/lib/useNetworkStatus";
import { runSync } from "@/lib/sync/runSync";

/**
 * Triggers a best-effort durable cloud sync (`lib/sync`) when the app opens,
 * returns to the foreground, or regains connectivity. Renders nothing. `runSync`
 * is a safe no-op unless the parent opted into cloud backup (`cloudSyncEnabled`)
 * and is signed in, so mounting this is always harmless. A ref holds the latest
 * flag so the AppState subscription doesn't churn as settings change.
 *
 * This is distinct from the offline interaction queue (`lib/sync-queue` +
 * `lib/useSyncOffline`, ported from v2), which captures like/unlike/completion
 * *events*; SyncManager drives the full Supabase *state* sync (stories, badges,
 * streaks, favorites, read, profile stubs).
 */
export function SyncManager() {
  const { settings } = useSettings();
  const { isConnected, isInternetReachable } = useNetworkStatus();
  // isInternetReachable is tri-state (null while probing); only explicit false is offline.
  const isOnline = isConnected && isInternetReachable !== false;

  const enabledRef = useRef(settings.cloudSyncEnabled);
  useEffect(() => {
    enabledRef.current = settings.cloudSyncEnabled;
  }, [settings.cloudSyncEnabled]);

  // Sync on mount and whenever connectivity is (re)gained.
  useEffect(() => {
    if (isOnline) void runSync(enabledRef.current);
  }, [isOnline]);

  // Sync when the app returns to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") void runSync(enabledRef.current);
    });
    return () => sub.remove();
  }, []);

  return null;
}
