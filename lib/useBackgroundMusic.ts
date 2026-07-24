import { useCallback } from "react";
import type { StoryMode } from "@/constants/story-theme";

export interface BackgroundMusicState {
  musicMuted: boolean;
  musicLoading: boolean;
  musicPlaying: boolean;
  startBgMusic: () => Promise<void>;
  stopBgMusic: () => Promise<void>;
  toggleBgMusic: () => Promise<void>;
}

/**
 * Background music is intentionally disabled for this release because the
 * repository does not contain reviewed, licensed audio tracks. The stable
 * no-op contract lets story playback clean up safely without issuing network
 * requests, creating retry timers, or exposing a partially working feature.
 */
export function useBackgroundMusic(_storyMode: StoryMode): BackgroundMusicState {
  const noOp = useCallback(async (): Promise<void> => undefined, []);

  return {
    musicMuted: true,
    musicLoading: false,
    musicPlaying: false,
    startBgMusic: noOp,
    stopBgMusic: noOp,
    toggleBgMusic: noOp,
  };
}
