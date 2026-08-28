import { useState, useEffect, useRef, useCallback, type MutableRefObject } from "react";
import { fetch } from "expo/fetch";
import { getApiUrl } from "@/lib/query-client";
import type { Hero } from "@/constants/heroes";
import type { StoryFull } from "@/constants/types";
import type { StoryState } from "@/constants/story-theme";

export interface SceneGenerationOptions {
  hero: Hero | undefined;
  storyData: StoryFull | null;
  storyState: StoryState;
  currentPartIndex: number;
}

export interface SceneGenerationState {
  sceneImage: string | null;
  sceneLoading: boolean;
  sceneError: boolean;
  loadSceneImage: (partText: string, partIndex: number) => Promise<void>;
  clearSceneImage: () => void;
  /** Per-part image cache; handed to the completion screen via lib/scene-handoff.ts. */
  sceneCacheRef: MutableRefObject<Record<number, string>>;
}

/**
 * Scene illustration for the current story part: per-part caching, automatic
 * load on part change, and retry with backoff (2 retries at 4s/8s).
 */
export function useSceneGeneration({ hero, storyData, storyState, currentPartIndex }: SceneGenerationOptions): SceneGenerationState {
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const [sceneLoading, setSceneLoading] = useState(false);
  const [sceneError, setSceneError] = useState(false);
  const sceneCacheRef = useRef<Record<number, string>>({});
  const sceneRetryCountRef = useRef(0);

  const loadSceneImage = useCallback(async (partText: string, partIndex: number) => {
    if (!hero) return;
    setSceneLoading(true);
    setSceneImage(null);
    setSceneError(false);
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/generate-scene", baseUrl);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroName: hero.name,
          sceneText: partText,
          heroDescription: hero.description,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSceneImage(data.image);
        sceneCacheRef.current[partIndex] = data.image;
      } else {
        setSceneError(true);
      }
    } catch (e) {
      console.error("Scene generation failed:", e);
      setSceneError(true);
    }
    setSceneLoading(false);
  }, [hero]);

  const clearSceneImage = useCallback(() => {
    setSceneImage(null);
  }, []);

  useEffect(() => {
    sceneRetryCountRef.current = 0;
    if (storyState === "ready" && storyData && storyData.parts[currentPartIndex]) {
      const partText = storyData.parts[currentPartIndex].text;
      if (sceneCacheRef.current[currentPartIndex]) {
        setSceneImage(sceneCacheRef.current[currentPartIndex]);
        setSceneLoading(false);
        setSceneError(false);
      } else {
        loadSceneImage(partText, currentPartIndex);
      }
    }
  }, [currentPartIndex, storyState]);

  useEffect(() => {
    if (sceneError && storyData && storyData.parts[currentPartIndex] && sceneRetryCountRef.current < 2) {
      const retryDelay = (sceneRetryCountRef.current + 1) * 4000;
      const timeout = setTimeout(() => {
        sceneRetryCountRef.current += 1;
        loadSceneImage(storyData.parts[currentPartIndex].text, currentPartIndex);
      }, retryDelay);
      return () => clearTimeout(timeout);
    }
  }, [sceneError, currentPartIndex]);

  return { sceneImage, sceneLoading, sceneError, loadSceneImage, clearSceneImage, sceneCacheRef };
}
