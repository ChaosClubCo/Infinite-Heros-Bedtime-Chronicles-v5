import { getConsentGiven } from "@/lib/consent-record";
import { getOnboardingComplete } from "@/lib/storage";
import { runStorageMigrations } from "@/lib/storage-migration";

export type LaunchRoute = "/parental-consent" | "/welcome" | "/(tabs)";

/**
 * Single source of truth for the cold-start routing decision.
 *
 * COPPA gate: the exact current verifiable parental-consent record must exist
 * before any data-collecting / AI feature, so it takes precedence over
 * onboarding. Legacy version-only records intentionally fail this check and
 * route upgraded installs through renewed consent.
 *
 * On any storage, migration, parsing, or hashing failure we fail safe to the
 * consent gate rather than silently letting the app through.
 */
export async function resolveLaunchRoute(): Promise<LaunchRoute> {
  try {
    // Run pending AsyncStorage schema migrations before reading either state.
    // This is the earliest storage touch on cold start and is idempotent.
    await runStorageMigrations();

    const [consented, onboarded] = await Promise.all([
      getConsentGiven(),
      getOnboardingComplete(),
    ]);
    if (!consented) return "/parental-consent";
    if (!onboarded) return "/welcome";
    return "/(tabs)";
  } catch (e) {
    console.error(
      "[launch-gate] Failed to verify consent/onboarding state, routing to consent gate",
      e,
    );
    return "/parental-consent";
  }
}
