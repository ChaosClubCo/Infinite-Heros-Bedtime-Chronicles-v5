import { useState, useEffect, useRef, useCallback } from "react";
import type { StoryMode, StoryState } from "@/constants/story-theme";

export interface SleepTimerOptions {
  sleepTimerParam: string | undefined;
  storyState: StoryState;
  storyMode: StoryMode;
  /** Invoked when the timer expires (the screen stops narration + music). */
  onExpire: () => void;
}

export interface SleepTimerState {
  timerRemaining: number | null;
  clearSleepTimer: () => void;
}

/** Sleep-mode countdown that starts when the story becomes ready. */
export function useSleepTimer({ sleepTimerParam, storyState, storyMode, onExpire }: SleepTimerOptions): SleepTimerState {
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearSleepTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startSleepTimer = useCallback(() => {
    if (!sleepTimerParam || sleepTimerParam === "none") return;
    const minutes = parseInt(sleepTimerParam, 10);
    if (isNaN(minutes)) return;
    let remaining = minutes * 60;
    setTimerRemaining(remaining);
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setTimerRemaining(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        onExpire();
        setTimerRemaining(null);
      }
    }, 1000);
  }, [sleepTimerParam]);

  useEffect(() => {
    if (storyState === "ready" && storyMode === "sleep" && sleepTimerParam && sleepTimerParam !== "none") {
      startSleepTimer();
    }
  }, [storyState]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { timerRemaining, clearSleepTimer };
}
