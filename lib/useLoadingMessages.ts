import { useState, useEffect, useRef } from "react";
import { LOADING_MESSAGE_INTERVAL_MS } from "@/constants/timing";
import { LOADING_MESSAGES, type StoryMode } from "@/constants/story-theme";

export interface LoadingMessagesState {
  loadingMsg: number;
  messages: string[];
}

/** Rotating loading-message index for the story-generation view. */
export function useLoadingMessages(storyMode: StoryMode): LoadingMessagesState {
  const [loadingMsg, setLoadingMsg] = useState(0);
  const loadingMsgRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const messages = LOADING_MESSAGES[storyMode] || LOADING_MESSAGES.classic;

  useEffect(() => {
    const msgs = LOADING_MESSAGES[storyMode] || LOADING_MESSAGES.classic;
    loadingMsgRef.current = setInterval(() => {
      setLoadingMsg((prev) => (prev + 1) % msgs.length);
    }, LOADING_MESSAGE_INTERVAL_MS);
    return () => {
      if (loadingMsgRef.current) clearInterval(loadingMsgRef.current);
    };
  }, [storyMode]);

  return { loadingMsg, messages };
}
