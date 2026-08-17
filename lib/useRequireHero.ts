import { useEffect } from "react";
import { router } from "expo-router";
import { HEROES } from "@/constants/heroes";
import type { Hero } from "@/constants/heroes";

/**
 * Resolves a heroId route param to a Hero, leaving the screen if it's missing.
 * A missing/unknown heroId (stale deep link) leaves nothing to configure.
 * Navigation happens in an effect — never during render — and guards against
 * an empty back stack when the screen is the app's entry point.
 * Callers must render null while the returned hero is undefined.
 */
export function useRequireHero(heroId: string | undefined): Hero | undefined {
  const hero = HEROES.find((h) => h.id === heroId);

  useEffect(() => {
    if (!hero) {
      if (router.canGoBack()) router.back();
      else router.replace("/(tabs)");
    }
  }, [hero]);

  return hero;
}
