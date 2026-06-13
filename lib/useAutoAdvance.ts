import { useEffect, useRef, useCallback } from "react";
import { MS_PER_WORD, MIN_READING_TIME_MS } from "@/constants/timing";
import type { StoryFull } from "@/constants/types";
import type { StoryMode, StoryState } from "@/constants/story-theme";

export interface AutoAdvanceOptions {
  storyState: StoryState;
  storyMode: StoryMode;
  storyData: StoryFull | null;
  currentPartIndex: number;
  /** Invoked when the reading time elapses (the screen advances + scrolls to top). */
  onAdvance: () => void;
}

export interface AutoAdvanceState {
  cancelAutoAdvance: () => void;
}

/** Sleep-mode auto-advance: moves to the next part after an estimated reading time. */
export function useAutoAdvance({ storyState, storyMode, storyData, currentPartIndex, onAdvance }: AutoAdvanceOptions): AutoAdvanceState {
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
  }, []);

  useEffect(() => {
    if (storyState === "ready" && storyMode === "sleep" && storyData) {
      const currentPart = storyData.parts[currentPartIndex];
      if (currentPart && currentPartIndex < storyData.parts.length - 1) {
        const wordCount = currentPart.text.split(/\s+/).length;
        const readingTimeMs = Math.max(wordCount * MS_PER_WORD, MIN_READING_TIME_MS);
        autoAdvanceRef.current = setTimeout(() => {
          onAdvance();
        }, readingTimeMs);
        return () => {
          if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
        };
      }
    }
  }, [currentPartIndex, storyState, storyMode]);

  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  return { cancelAutoAdvance };
}
