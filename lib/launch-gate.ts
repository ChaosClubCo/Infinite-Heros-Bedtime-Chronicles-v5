import { getOnboardingComplete } from "@/lib/storage";
import { getVerifiedConsentGiven } from "@/lib/consentEvidence";
import { runStorageMigrations } from "@/lib/storage-migration";

export type LaunchRoute = "/parental-consent" | "/welcome" | "/(tabs)";

/**
 * Single source of truth for the cold-start routing decision.
 *
 * COPPA gate: exact, verifiable parental consent must come before any
 * data-collecting / AI feature, so it takes precedence over onboarding.
 * On any storage or hashing failure we fail safe to the consent gate rather
 * than silently letting the app through.
 *
 * Used by app/index.tsx (cold start) and app/parental-consent.tsx
 * (post-consent destination).
 */
export async function resolveLaunchRoute(): Promise<LaunchRoute> {
  try {
    await runStorageMigrations();

    const [consented, onboarded] = await Promise.all([
      getVerifiedConsentGiven(),
      getOnboardingComplete(),
    ]);
    if (!consented) return "/parental-consent";
    if (!onboarded) return "/welcome";
    return "/(tabs)";
  } catch (e) {
    console.error(
      "[launch-gate] Failed to read verified consent/onboarding state, routing to consent gate",
      e,
    );
    return "/parental-consent";
  }
}
