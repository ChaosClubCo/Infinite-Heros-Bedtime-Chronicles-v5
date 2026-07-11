import type { CachedStory } from "@/constants/types";

/**
 * Route params for replaying a saved story via /story.
 *
 * Every replay entry point (home recents, library, saved, Memory Jar) must
 * build its params here so playback settings are identical regardless of
 * where the replay started.
 */
export function buildStoryReplayParams(item: CachedStory) {
  return {
    heroId: item.heroId,
    mode: item.mode,
    duration: "medium",
    voice: item.voice || "moonbeam",
    speed: item.speed || "medium",
    replayJson: JSON.stringify(item.story),
  };
}
