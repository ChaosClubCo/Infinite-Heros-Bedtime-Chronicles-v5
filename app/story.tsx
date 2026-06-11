import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import Colors from "@/constants/colors";
import { HEROES } from "@/constants/heroes";
import { StarField } from "@/components/StarField";
import { getApiUrl } from "@/lib/query-client";
import { fetch } from "expo/fetch";
import { StoryFull } from "@/constants/types";
import { getParentControls } from "@/lib/storage";
import { MS_PER_WORD, MIN_READING_TIME_MS, LOADING_MESSAGE_INTERVAL_MS } from "@/constants/timing";
import { LOADING_MESSAGES, MODE_THEME, MODE_VOICES, SPEED_RATES, type StoryState } from "@/constants/story-theme";
import { FloatingParticle } from "@/components/FloatingParticle";
import { StoryGeneratingView } from "@/components/StoryGeneratingView";
import { StorySceneDisplay } from "@/components/StorySceneDisplay";
import { StoryPlayerControls } from "@/components/StoryPlayerControls";
import { StoryTopBar } from "@/components/StoryTopBar";
import { SleepTimerBar } from "@/components/SleepTimerBar";
import { StoryTextDisplay } from "@/components/StoryTextDisplay";
import { StoryProgressBar } from "@/components/StoryProgressBar";
import { StoryChoices } from "@/components/StoryChoices";

export default function StoryScreen() {
  const { heroId, duration, voice, mode, madlibWords, soundscape, sleepTimer, speed: initialSpeed, replayJson, setting, tone, childName, sidekick, problem } =
    useLocalSearchParams<{
      heroId: string;
      duration: string;
      voice: string;
      mode: string;
      madlibWords: string;
      soundscape: string;
      sleepTimer: string;
      speed: string;
      replayJson: string;
      setting: string;
      tone: string;
      childName: string;
      sidekick: string;
      problem: string;
    }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const storyMode = (mode || "classic") as keyof typeof MODE_THEME;
  const theme = MODE_THEME[storyMode] || MODE_THEME.classic;

  const defaultSpeed = initialSpeed || (storyMode === "sleep" ? "gentle" : "medium");

  const modeVoices = MODE_VOICES[storyMode] || MODE_VOICES.classic;
  const defaultVoice = voice || modeVoices[0].id;

  const [storyData, setStoryData] = useState<StoryFull | null>(null);
  const [storyState, setStoryState] = useState<StoryState>("generating");
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioPosition, setAudioPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(defaultSpeed);
  const [currentVoice, setCurrentVoice] = useState(defaultVoice);
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const [sceneLoading, setSceneLoading] = useState(false);
  const [sceneError, setSceneError] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [musicMuted, setMusicMuted] = useState(false);
  const [musicLoading, setMusicLoading] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [videoJobId, setVideoJobId] = useState<string | null>(null);
  // Large-range modulo so the ?t= cache-buster varies across many consecutive plays.
  // The actual track selection on the server is random; this value only busts HTTP cache.
  const MUSIC_TRACK_INDEX_RANGE = 1000;
  const musicTrackIndexRef = useRef(Math.floor(Math.random() * MUSIC_TRACK_INDEX_RANGE));
  const scrollRef = useRef<ScrollView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingMsgRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const bgMusicRef = useRef<Audio.Sound | null>(null);
  const sceneCacheRef = useRef<Record<number, string>>({});
  const sceneRetryCountRef = useRef(0);

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

  const hero = HEROES.find((h) => h.id === heroId);

  useEffect(() => {
    const messages = LOADING_MESSAGES[storyMode] || LOADING_MESSAGES.classic;
    loadingMsgRef.current = setInterval(() => {
      setLoadingMsg((prev) => (prev + 1) % messages.length);
    }, LOADING_MESSAGE_INTERVAL_MS);
    return () => {
      if (loadingMsgRef.current) clearInterval(loadingMsgRef.current);
    };
  }, [storyMode]);

  const startSleepTimer = useCallback(() => {
    if (!sleepTimer || sleepTimer === "none") return;
    const minutes = parseInt(sleepTimer, 10);
    if (isNaN(minutes)) return;
    let remaining = minutes * 60;
    setTimerRemaining(remaining);
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setTimerRemaining(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        stopAudio();
        stopBgMusic();
        setTimerRemaining(null);
      }
    }, 1000);
  }, [sleepTimer]);

  const generateStory = useCallback(async () => {
    if (!hero) return;
    setStoryState("generating");
    setStoryData(null);
    setCurrentPartIndex(0);
    setSceneImage(null);

    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/generate-story", baseUrl);

      const bodyData: Record<string, unknown> = {
        heroName: hero.name,
        heroTitle: hero.title,
        heroPower: hero.power,
        heroDescription: hero.description,
        duration: duration || "medium",
        mode: storyMode,
      };

      if (storyMode === "madlibs" && madlibWords) {
        try { bodyData.madlibWords = JSON.parse(madlibWords); } catch {}
      }

      if (storyMode === "sleep" && soundscape) bodyData.soundscape = soundscape;
      if (storyMode === "classic") {
        if (setting) bodyData.setting = setting;
        if (tone) bodyData.tone = tone;
        if (sidekick) bodyData.sidekick = sidekick;
        if (problem) bodyData.problem = problem;
      }
      if (childName) bodyData.childName = childName;

      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) throw new Error("Failed to generate story");

      const data = await res.json();
      setStoryData(data as StoryFull);
      setStoryState("ready");
    } catch (error) {
      console.error("Story generation error:", error);
      setStoryState("error");
    }
  }, [hero, duration, storyMode, madlibWords]);

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

  useEffect(() => {
    getParentControls().then((pc) => setVideoEnabled(pc.videoEnabled)).catch((e) => console.error("Failed to load parent controls:", e));

    if (replayJson) {
      try {
        const replayed = JSON.parse(replayJson) as StoryFull;
        setStoryData(replayed);
        setStoryState("ready");
        setCurrentPartIndex(0);
      } catch {
        generateStory();
      }
    } else {
      generateStory();
    }
    startBgMusic();
    return () => {
      stopAudio();
      stopBgMusic();
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  useEffect(() => {
    if (storyState === "ready" && storyMode === "sleep" && sleepTimer && sleepTimer !== "none") {
      startSleepTimer();
    }
  }, [storyState]);

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
      if (videoEnabled) {
        triggerVideoGeneration(partText);
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

  useEffect(() => {
    if (storyState === "ready" && storyMode === "sleep" && storyData) {
      const currentPart = storyData.parts[currentPartIndex];
      if (currentPart && currentPartIndex < storyData.parts.length - 1) {
        const wordCount = currentPart.text.split(/\s+/).length;
        const readingTimeMs = Math.max(wordCount * MS_PER_WORD, MIN_READING_TIME_MS);
        autoAdvanceRef.current = setTimeout(() => {
          setCurrentPartIndex((prev) => prev + 1);
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        }, readingTimeMs);
        return () => {
          if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
        };
      }
    }
  }, [currentPartIndex, storyState, storyMode]);

  const currentPart = storyData?.parts[currentPartIndex];
  const isLastPart = storyData ? currentPartIndex >= storyData.parts.length - 1 : false;
  const hasChoices = currentPart?.choices && currentPart.choices.length > 0 && !isLastPart;

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

  const handleChoiceSelect = (choiceIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    stopAudio();
    setCurrentPartIndex((prev) => prev + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleStoryComplete = () => {
    if (!hero || !storyData) return;
    stopAudio();
    stopBgMusic();
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    router.push({
      pathname: "/completion",
      params: {
        heroId: hero.id,
        mode: storyMode,
        storyJson: JSON.stringify(storyData),
        scenesJson: JSON.stringify(sceneCacheRef.current),
      },
    });
  };

  const handleClose = () => {
    stopAudio();
    stopBgMusic();
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    router.dismissAll();
  };

  const handlePrevPart = () => {
    if (currentPartIndex > 0) {
      Haptics.selectionAsync();
      stopAudio();
      setCurrentPartIndex((prev) => prev - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleNextPart = () => {
    if (storyData && currentPartIndex < storyData.parts.length - 1) {
      Haptics.selectionAsync();
      stopAudio();
      setCurrentPartIndex((prev) => prev + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  if (!hero) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Hero not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.errorLink}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isSleep = storyMode === "sleep";
  const messages = LOADING_MESSAGES[storyMode] || LOADING_MESSAGES.classic;

  const progressPct = storyData
    ? ((currentPartIndex + 1) / storyData.parts.length) * 100
    : 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
      <StarField />

      {[0, 1, 2, 3, 4, 5].map((i) => (
        <FloatingParticle key={i} delay={i * 800} accent={theme.accent} />
      ))}

      <StoryTopBar
        topInset={topInset}
        isReady={storyState === "ready" && !!storyData}
        storyTitle={storyData?.title}
        currentPartIndex={currentPartIndex}
        accent={theme.accent}
        onClose={handleClose}
      />

      {timerRemaining !== null && timerRemaining > 0 && (
        <SleepTimerBar remainingSeconds={timerRemaining} accent={theme.accent} />
      )}

      {storyState === "generating" || storyState === "error" ? (
        <StoryGeneratingView
          storyState={storyState}
          hero={hero}
          theme={theme}
          loadingMsg={loadingMsg}
          messages={messages}
          onRetry={generateStory}
        />
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[styles.storyScrollContent, { paddingBottom: bottomInset + 160 }]}
            showsVerticalScrollIndicator={false}
          >
            <StorySceneDisplay
              sceneImage={sceneImage}
              sceneLoading={sceneLoading}
              sceneError={sceneError}
              theme={theme}
              videoEnabled={videoEnabled}
              videoJobId={videoJobId}
              onLoadScene={() => { if (currentPart) loadSceneImage(currentPart.text, currentPartIndex); }}
            />

            {currentPart && (
              <StoryTextDisplay
                text={currentPart.text}
                isSleep={isSleep}
                accent={theme.accent}
                partIndex={currentPartIndex}
              />
            )}

            {storyData && (
              <StoryProgressBar
                progressPct={progressPct}
                partsRemaining={storyData.parts.length - currentPartIndex - 1}
                accent={theme.accent}
              />
            )}

            {hasChoices && (
              <StoryChoices
                heroName={hero.name}
                choices={currentPart!.choices!}
                accent={theme.accent}
                choiceColors={theme.choiceColors}
                partIndex={currentPartIndex}
                onSelect={handleChoiceSelect}
              />
            )}
          </ScrollView>

          {storyState === "ready" && storyData && (
            <StoryPlayerControls
              isSpeaking={isSpeaking}
              audioLoading={audioLoading}
              audioDuration={audioDuration}
              audioPosition={audioPosition}
              playbackSpeed={playbackSpeed}
              currentVoice={currentVoice}
              modeVoices={modeVoices}
              currentPartIndex={currentPartIndex}
              isLastPart={isLastPart}
              storyMode={storyMode}
              theme={theme}
              musicMuted={musicMuted}
              musicLoading={musicLoading}
              musicPlaying={musicPlaying}
              bottomInset={bottomInset}
              onSpeedCycle={cycleSpeed}
              onVoiceCycle={cycleVoice}
              onPrevPart={handlePrevPart}
              onNextPart={handleNextPart}
              onSpeakToggle={speakCurrentPart}
              onToggleMusic={toggleBgMusic}
              onComplete={handleStoryComplete}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  centered: { justifyContent: "center", alignItems: "center" },
  storyScrollContent: {
    paddingTop: 0,
  },
  errorText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 18,
    color: Colors.textMuted,
  },
  errorLink: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: Colors.accent,
    marginTop: 16,
  },
});
