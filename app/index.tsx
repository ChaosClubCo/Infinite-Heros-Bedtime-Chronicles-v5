import React, { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { resolveLaunchRoute, type LaunchRoute } from "@/lib/launch-gate";

/**
 * Launch gate — the explicit "/" route.
 *
 * Cold start lands here, waits for the consent/onboarding decision, then
 * redirects. Rendering nothing while the decision resolves guarantees no
 * data-collecting screen (the tabs) can flash before an un-consented install
 * is routed to the parental-consent gate.
 */
export default function IndexScreen() {
  const [target, setTarget] = useState<LaunchRoute | null>(null);

  useEffect(() => {
    let cancelled = false;
    // resolveLaunchRoute never rejects — storage failures fail safe to the
    // consent gate inside the helper.
    resolveLaunchRoute().then((route) => {
      if (!cancelled) setTarget(route);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!target) return null;
  return <Redirect href={target} />;
}
