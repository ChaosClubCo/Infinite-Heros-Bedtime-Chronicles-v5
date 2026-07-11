import { getConsentGiven, getOnboardingComplete } from "@/lib/storage";

export type LaunchRoute = "/parental-consent" | "/welcome" | "/(tabs)";

/**
 * Single source of truth for the cold-start routing decision.
 *
 * COPPA gate: verifiable parental consent must come before any
 * data-collecting / AI feature, so it takes precedence over onboarding.
 * On any storage failure we fail safe to the consent gate rather than
 * silently letting the app through.
 *
 * Used by app/index.tsx (cold start) and app/parental-consent.tsx
 * (post-consent destination).
 */
export async function resolveLaunchRoute(): Promise<LaunchRoute> {
  try {
    const [consented, onboarded] = await Promise.all([
      getConsentGiven(),
      getOnboardingComplete(),
    ]);
    if (!consented) return "/parental-consent";
    if (!onboarded) return "/welcome";
    return "/(tabs)";
  } catch (e) {
    console.error(
      "[launch-gate] Failed to read consent/onboarding state, routing to consent gate",
      e,
    );
    return "/parental-consent";
  }
}
