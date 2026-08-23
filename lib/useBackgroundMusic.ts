import { useState, useRef, useCallback } from "react";
import { Audio } from "expo-av";
import { getApiUrl } from "@/lib/query-client";
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
 * Looping background music for the story screen. The caller starts/stops
 * playback explicitly (typically in its mount/unmount effect).
 */
export function useBackgroundMusic(storyMode: StoryMode): BackgroundMusicState {
  const [musicMuted, setMusicMuted] = useState(false);
  const [musicLoading, setMusicLoading] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  // Large-range modulo so the ?t= cache-buster varies across many consecutive plays.
  // The actual track selection on the server is random; this value only busts HTTP cache.
  const MUSIC_TRACK_INDEX_RANGE = 1000;
  const musicTrackIndexRef = useRef(Math.floor(Math.random() * MUSIC_TRACK_INDEX_RANGE));
  const bgMusicRef = useRef<Audio.Sound | null>(null);

  const MUSIC_VOLUME = storyMode === "sleep" ? 0.12 : 0.15;

  const stopBgMusic = useCallback(async () => {
    if (bgMusicRef.current) {
      try {
        await bgMusicRef.current.stopAsync();
        await bgMusicRef.current.unloadAsync();
      } catch {}
      bgMusicRef.current = null;
    }
    setMusicPlaying(false);
  }, []);

  const startBgMusic = useCallback(async () => {
    setMusicLoading(true);
    try {
      const baseUrl = getApiUrl();
      // Use a random track index so each story session can get a different track when
      // multiple variants exist (e.g. classic.mp3, classic_2.mp3, …).
      // The ?t= param also busts HTTP caches so the server may select a new random file.
      const trackIndex = musicTrackIndexRef.current;
      const musicUrl = new URL(`/api/music/${storyMode}?t=${trackIndex}`, baseUrl).toString();

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: musicUrl },
        { shouldPlay: true, volume: MUSIC_VOLUME, isLooping: false }
      );

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          // Advance track index so the next load requests a different cache-busted URL,
          // enabling variety when multiple track variants exist for this mode.
          musicTrackIndexRef.current = (musicTrackIndexRef.current + 1) % MUSIC_TRACK_INDEX_RANGE;
          try {
            await sound.unloadAsync();
          } catch {}
          bgMusicRef.current = null;
          setMusicPlaying(false);
          // Brief pause before reloading to prevent rapid back-to-back network requests
          // in case the track is very short or the server returns an error.
          const MUSIC_RELOAD_DELAY_MS = 500;
          setTimeout(() => {
            setMusicPlaying((prev) => {
              if (!prev) startBgMusic();
              return prev;
            });
          }, MUSIC_RELOAD_DELAY_MS);
        }
      });

      bgMusicRef.current = sound;
      setMusicPlaying(true);
      setMusicLoading(false);
    } catch (err) {
      if (__DEV__) console.log("Background music failed:", err);
      setMusicLoading(false);
    }
  }, [storyMode, MUSIC_VOLUME]);

  const toggleBgMusic = useCallback(async () => {
    if (!bgMusicRef.current) return;
    try {
      if (musicMuted) {
        await bgMusicRef.current.setVolumeAsync(MUSIC_VOLUME);
        setMusicMuted(false);
      } else {
        await bgMusicRef.current.setVolumeAsync(0);
        setMusicMuted(true);
      }
    } catch {}
  }, [musicMuted, MUSIC_VOLUME]);

  return { musicMuted, musicLoading, musicPlaying, startBgMusic, stopBgMusic, toggleBgMusic };
}
