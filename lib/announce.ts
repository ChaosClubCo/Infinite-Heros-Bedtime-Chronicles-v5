import { AccessibilityInfo, Platform } from "react-native";

/**
 * Speak a status change to assistive technology.
 *
 * `accessibilityLiveRegion` only exists on Android, so a component that relies
 * on it alone is silent on iOS — a common half-fix. This helper covers the
 * other half: VoiceOver and TalkBack both announce through
 * `announceForAccessibility`, so pair the two.
 *
 * Use it for state the user cannot see changing — generation finishing, moving
 * to the next part, an error appearing — not for content already on screen.
 */
export function announceForAccessibility(message: string): void {
  if (!message) return;

  // No-ops safely on web, where the API is not implemented.
  if (Platform.OS === "web") return;

  try {
    AccessibilityInfo.announceForAccessibility(message);
  } catch {
    // Announcements are an enhancement; never let one break a render path.
  }
}

/**
 * Announce only when a screen reader is actually running.
 *
 * Slightly more polite than the unconditional version for chatty updates,
 * at the cost of being async.
 */
export async function announceIfScreenReaderEnabled(message: string): Promise<void> {
  if (!message || Platform.OS === "web") return;
  try {
    const enabled = await AccessibilityInfo.isScreenReaderEnabled();
    if (enabled) AccessibilityInfo.announceForAccessibility(message);
  } catch {
    // Ignore: the announcement is an enhancement, not a requirement.
  }
}
