import { useReducedMotion as useOSReducedMotion } from "react-native-reanimated";
import { useSettings } from "@/lib/SettingsContext";

/**
 * Whether animation should be suppressed for this viewer.
 *
 * Two independent signals mean "reduce motion", and honouring only one of them
 * is the common half-fix:
 *
 * - the **device** setting (iOS "Reduce Motion", Android "Remove animations"),
 *   read via reanimated's `useReducedMotion()`. This is the one an
 *   accessibility-configured device actually sets, and the one the app
 *   previously ignored entirely.
 * - the **in-app** toggle in Settings, for a parent who wants a calmer screen
 *   at bedtime without changing their whole phone.
 *
 * Either one is sufficient. Keeping the OR in a single hook means a new
 * animated component gets both for free, instead of each surface
 * re-deciding (and half of them forgetting one).
 */
export function useMotionPreference(): { reducedMotion: boolean } {
  const osReducedMotion = useOSReducedMotion();
  const { settings } = useSettings();
  return { reducedMotion: osReducedMotion || (settings?.reducedMotion ?? false) };
}
