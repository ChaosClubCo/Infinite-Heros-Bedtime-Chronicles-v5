import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useSettings } from "@/lib/SettingsContext";
import { runSync } from "@/lib/sync/runSync";

/**
 * Runs a best-effort cloud sync when the app opens and each time it returns to
 * the foreground. Renders nothing. `runSync` is a safe no-op unless the parent
 * has opted in (`cloudSyncEnabled`) and is signed in, so mounting this is always
 * harmless. A ref holds the latest flag so the AppState subscription doesn't
 * churn as settings change.
 */
export function SyncManager() {
  const { settings } = useSettings();
  const enabledRef = useRef(settings.cloudSyncEnabled);
  useEffect(() => {
    enabledRef.current = settings.cloudSyncEnabled;
  }, [settings.cloudSyncEnabled]);

  useEffect(() => {
    void runSync(enabledRef.current);
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") void runSync(enabledRef.current);
    });
    return () => sub.remove();
  }, []);

  return null;
}
