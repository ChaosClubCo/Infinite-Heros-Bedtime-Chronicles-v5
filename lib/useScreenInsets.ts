import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Expo web has no native safe areas; these fixed values reserve the same
// visual chrome the native app gets, keeping spacing identical across platforms.
const WEB_TOP_INSET = 67;
const WEB_BOTTOM_INSET = 34;

/**
 * Safe-area insets with the app's standard web fallbacks.
 * Single home for the `Platform.OS === "web" ? 67 : insets.top` pattern
 * previously copy-pasted across screens.
 */
export function useScreenInsets(): { topInset: number; bottomInset: number } {
  const insets = useSafeAreaInsets();
  return {
    topInset: Platform.OS === "web" ? WEB_TOP_INSET : insets.top,
    bottomInset: Platform.OS === "web" ? WEB_BOTTOM_INSET : insets.bottom,
  };
}
