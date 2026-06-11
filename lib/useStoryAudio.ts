import { useState, useRef, useCallback } from "react";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { fetch } from "expo/fetch";
import { getApiUrl } from "@/lib/query-client";
import { SPEED_RATES, type ModeVoice, type StoryMode } from "@/constants/story-theme";
import type { StoryPart } from "@/constants/types";

export interface StoryAudioOptions {
  currentPart: StoryPart | undefined;
  storyMode: StoryMode;
  initialVoice: string;
  initialSpeed: string;
  modeVoices: ModeVoice[];
}

export interface StoryAudioState {
  isSpeaking: boolean;
  audioLoading: boolean;
  audioPosition: number;
  audioDuration: number;
  playbackSpeed: string;
  currentVoice: string;
  speakCurrentPart: () => Promise<void>;
  stopAudio: () => Promise<void>;
  cycleSpeed: () => Promise<void>;
  cycleVoice: () => Promise<void>;
}

/** TTS narration playback for the current story part. */
export function useStoryAudio({ currentPart, storyMode, initialVoice, initialSpeed, modeVoices }: StoryAudioOptions): StoryAudioState {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioPosition, setAudioPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(initialSpeed);
  const [currentVoice, setCurrentVoice] = useState(initialVoice);
  const soundRef = useRef<Audio.Sound | null>(null);

  const stopAudio = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
    setIsSpeaking(false);
    setAudioPosition(0);
    setAudioDuration(0);
  }, []);

  const speakCurrentPart = useCallback(async () => {
    if (!currentPart) return;
    if (isSpeaking || audioLoading) {
      await stopAudio();
      return;
    }

    setAudioLoading(true);
    try {
      const baseUrl = getApiUrl();
      const ttsUrl = new URL("/api/tts", baseUrl);

      const response = await fetch(ttsUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: currentPart.text,
          voice: currentVoice,
          mode: storyMode,
        }),
      });

      if (!response.ok) throw new Error("TTS request failed");

      const data = await response.json();
      if (!data.audioUrl) throw new Error("No audio URL returned");

      const audioFileUrl = new URL(data.audioUrl, baseUrl).toString();

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const rate = SPEED_RATES[playbackSpeed] || 0.9;
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioFileUrl },
        { shouldPlay: false, rate, shouldCorrectPitch: true }
      );
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setAudioPosition(status.positionMillis || 0);
          setAudioDuration(status.durationMillis || 0);
          if (status.didJustFinish) {
            sound.unloadAsync();
            soundRef.current = null;
            setIsSpeaking(false);
            setAudioPosition(0);
            setAudioDuration(0);
          }
        }
      });

      await sound.playAsync();
      setIsSpeaking(true);
      setAudioLoading(false);
    } catch (err) {
      if (__DEV__) console.log("TTS error:", err);
      setAudioLoading(false);
      setIsSpeaking(false);
    }
  }, [currentPart, isSpeaking, audioLoading, storyMode, currentVoice, stopAudio, playbackSpeed]);

  const cycleSpeed = useCallback(async () => {
    const keys = ["gentle", "medium", "normal"];
    const idx = keys.indexOf(playbackSpeed);
    const next = keys[(idx + 1) % keys.length];
    setPlaybackSpeed(next);
    Haptics.selectionAsync();
    if (soundRef.current) {
      try {
        await soundRef.current.setRateAsync(SPEED_RATES[next], true);
      } catch {}
    }
  }, [playbackSpeed]);

  const cycleVoice = useCallback(async () => {
    const voices = modeVoices;
    const idx = voices.findIndex((v) => v.id === currentVoice);
    const next = voices[(idx + 1) % voices.length];
    setCurrentVoice(next.id);
    Haptics.selectionAsync();
    if (isSpeaking || audioLoading) {
      await stopAudio();
    }
  }, [currentVoice, modeVoices, isSpeaking, audioLoading, stopAudio]);

  return {
    isSpeaking,
    audioLoading,
    audioPosition,
    audioDuration,
    playbackSpeed,
    currentVoice,
    speakCurrentPart,
    stopAudio,
    cycleSpeed,
    cycleVoice,
  };
}
