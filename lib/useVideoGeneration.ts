import { useState, useEffect, useCallback } from "react";
import { getApiUrl } from "@/lib/query-client";
import { getParentControls } from "@/lib/storage";
import type { Hero } from "@/constants/heroes";
import type { StoryFull } from "@/constants/types";
import type { StoryState } from "@/constants/story-theme";

export interface VideoGenerationOptions {
  hero: Hero | undefined;
  storyData: StoryFull | null;
  storyState: StoryState;
  currentPartIndex: number;
}

export interface VideoGenerationState {
  videoEnabled: boolean;
  videoJobId: string | null;
}

/**
 * Optional scene-video generation: reads the parent-controls gate on mount
 * and kicks off a video job whenever the current part changes (when enabled).
 */
export function useVideoGeneration({ hero, storyData, storyState, currentPartIndex }: VideoGenerationOptions): VideoGenerationState {
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [videoJobId, setVideoJobId] = useState<string | null>(null);

  useEffect(() => {
    getParentControls().then((pc) => setVideoEnabled(pc.videoEnabled)).catch((e) => console.error("Failed to load parent controls:", e));
  }, []);

  const triggerVideoGeneration = useCallback(async (partText: string) => {
    if (!hero || !videoEnabled) return;
    setVideoJobId(null);
    try {
      const baseUrl = getApiUrl();
      const res = await globalThis.fetch(
        new URL("/api/generate-video", baseUrl).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sceneText: partText,
            heroName: hero.name,
            heroDescription: hero.description,
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.jobId) setVideoJobId(data.jobId);
      }
    } catch (e) {
      if (__DEV__) console.log("Video generation request failed:", e);
    }
  }, [hero, videoEnabled]);

  useEffect(() => {
    if (storyState === "ready" && storyData && storyData.parts[currentPartIndex]) {
      if (videoEnabled) {
        triggerVideoGeneration(storyData.parts[currentPartIndex].text);
      }
    }
  }, [currentPartIndex, storyState]);

  return { videoEnabled, videoJobId };
}
