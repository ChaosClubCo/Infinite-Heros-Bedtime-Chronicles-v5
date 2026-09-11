import type { CachedStory } from "@/constants/types";
import { DEFAULT_STORY_VOICE, DEFAULT_STORY_SPEED } from "@/constants/story-theme";

/**
 * Route params for replaying a saved story via /story.
 *
 * Every replay entry point (home recents, library, saved) must build its
 * params here so playback settings are identical regardless of where the
 * replay started.
 */
export function buildStoryReplayParams(item: CachedStory) {
  return {
    heroId: item.heroId,
    mode: item.mode,
    duration: "medium",
    voice: item.voice || DEFAULT_STORY_VOICE,
    speed: item.speed || DEFAULT_STORY_SPEED,
    replayJson: JSON.stringify(item.story),
  };
}
