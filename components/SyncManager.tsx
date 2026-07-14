import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useSettings } from "@/lib/SettingsContext";
import { useNetworkStatus } from "@/lib/useNetworkStatus";
import { runSync } from "@/lib/sync/runSync";
import { useProfile } from "@/lib/ProfileContext";
import { useAuth } from "@/lib/AuthContext";

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
  const { refreshProfiles } = useProfile();
  const { user } = useAuth();
  // isInternetReachable is tri-state (null while probing); only explicit false is offline.
  const isOnline = isConnected && isInternetReachable !== false;

  const enabledRef = useRef(settings.cloudSyncEnabled);
  useEffect(() => {
    enabledRef.current = settings.cloudSyncEnabled;
  }, [settings.cloudSyncEnabled]);

  // Sync on open, when connectivity/setting changes, and when the signed-in user
  // changes. `user?.id` in the deps re-runs this on sign-in (null → id) so a user
  // who signs in while already foregrounded+online backs up immediately, instead
  // of waiting for the next foreground/reconnect. `runSync` no-ops for a null user,
  // so the sign-out re-trigger (id → null) is harmless.
  useEffect(() => {
    if (settings.cloudSyncEnabled && isOnline) {
      void runSync(true).then((didSync) => {
        if (didSync) void refreshProfiles();
      });
    }
  }, [settings.cloudSyncEnabled, isOnline, refreshProfiles, user?.id]);

  // Sync when the app returns to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active" && enabledRef.current) {
        void runSync(true).then((didSync) => {
          if (didSync) void refreshProfiles();
        });
      }
    });
    return () => sub.remove();
  }, [refreshProfiles]);

  return null;
}
