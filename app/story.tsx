import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { HEROES } from "@/constants/heroes";
import { StarField } from "@/components/StarField";
import { getApiUrl } from "@/lib/query-client";
import { fetch } from "expo/fetch";
import { StoryFull } from "@/constants/types";
import { getParentControls, saveStoryScene } from "@/lib/storage";
import { MS_PER_WORD, MIN_READING_TIME_MS, LOADING_MESSAGE_INTERVAL_MS } from "@/constants/timing";
import { StoryGeneratingView } from "@/components/StoryGeneratingView";
import { StorySceneDisplay } from "@/components/StorySceneDisplay";
import { StoryPlayerControls } from "@/components/StoryPlayerControls";

type StoryState = "generating" | "ready" | "error";

const LOADING_MESSAGES = {
  classic: [
    "Charting the stars...",
    "Summoning your hero...",
    "Weaving the tale...",
    "Adding a sprinkle of magic...",
    "Almost ready for adventure...",
  ],
  madlibs: [
    "Mixing your silly words...",
    "Adding extra giggles...",
    "Stirring the funny pot...",
    "Sprinkling absurdity...",
    "Cooking up laughs...",
  ],
  sleep: [
    "Dimming the stars...",
    "Fluffing the clouds...",
    "Warming the moonbeams...",
    "Sprinkling sleepy dust...",
    "Preparing your dreamscape...",
  ],
};

const MODE_THEME = {
  classic: {
    accent: "#6366f1",
    accentLight: "#818cf8",
    gradient: ["#05051e", "#0a0a2e", "#05051e"] as [string, string, string],
    orbColor: "rgba(99, 102, 241, 0.08)",
    choiceColors: [
      ["#6366f1", "#4f46e5"] as [string, string],
      ["#8B5CF6", "#7C3AED"] as [string, string],
      ["#F59E0B", "#D97706"] as [string, string],
    ],
  },
  madlibs: {
    accent: "#F97316",
    accentLight: "#FB923C",
    gradient: ["#05051e", "#1A0A00", "#05051e"] as [string, string, string],
    orbColor: "rgba(249, 115, 22, 0.08)",
    choiceColors: [
      ["#F97316", "#EA580C"] as [string, string],
      ["#EF4444", "#DC2626"] as [string, string],
      ["#F59E0B", "#D97706"] as [string, string],
    ],
  },
  sleep: {
    accent: "#A855F7",
    accentLight: "#C084FC",
    gradient: ["#05051e", "#0D0520", "#05051e"] as [string, string, string],
    orbColor: "rgba(168, 85, 247, 0.08)",
    choiceColors: [
      ["#A855F7", "#7C3AED"] as [string, string],
      ["#8B5CF6", "#6D28D9"] as [string, string],
      ["#C084FC", "#9333EA"] as [string, string],
    ],
  },
};

function FloatingParticle({ delay, accent }: { delay: number; accent: string }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const screenWidth = Dimensions.get("window").width;
  const startX = Math.random() * screenWidth;
  const size = 2 + Math.random() * 3;

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-200, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        -1,
        false
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: startX,
          bottom: 100,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: accent,
        },
        animStyle,
      ]}
    />
  );
}

function ChoiceButton({
  label,
  index,
  onPress,
  colors,
}: {
  label: string;
  index: number;
  onPress: () => void;
  colors: [string, string][];
}) {
  const pair = colors[index % colors.length];

  return (
    <Animated.View entering={FadeInUp.duration(400).delay(index * 120)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.choiceButton,
          { transform: [{ scale: pressed ? 0.96 : 1 }] },
        ]}
        testID={`choice-${index}`}
      >
        <LinearGradient
          colors={pair}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.choiceGradient}
        >
          <View style={styles.choiceIndex}>
            <Text style={styles.choiceIndexText}>{String.fromCharCode(65 + index)}</Text>
          </View>
          <Text style={styles.choiceText}>{label}</Text>
          <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.6)" />
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const MODE_VOICES: Record<string, { id: string; label: string; accent: string }[]> = {
  sleep: [
    { id: "moonbeam", label: "Moonbeam", accent: "American" },
    { id: "whisper", label: "Whisper", accent: "American" },
    { id: "stardust", label: "Stardust", accent: "American" },
  ],
  classic: [
    { id: "captain", label: "Captain", accent: "British" },
    { id: "professor", label: "Professor", accent: "British" },
    { id: "aurora", label: "Aurora", accent: "American" },
  ],
  madlibs: [
    { id: "giggles", label: "Giggles", accent: "American" },
    { id: "blaze", label: "Blaze", accent: "American" },
    { id: "ziggy", label: "Ziggy", accent: "British" },
  ],
};

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

  const SPEED_RATES: Record<string, number> = { gentle: 0.8, medium: 0.9, normal: 1.0 };
  const SPEED_LABELS: Record<string, string> = { gentle: "Gentle", medium: "Medium", normal: "Normal" };
  const SPEED_ICONS: Record<string, "moon-outline" | "cloudy-night-outline" | "sunny-outline"> = { gentle: "moon-outline", medium: "cloudy-night-outline", normal: "sunny-outline" };
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

  const seekAudio = useCallback(async (fraction: number) => {
    if (!soundRef.current || audioDuration === 0) return;
    try {
      await soundRef.current.setPositionAsync(Math.floor(fraction * audioDuration));
    } catch {}
  }, [audioDuration]);

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

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
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

  const paragraphs = currentPart
    ? currentPart.text.split(/\n\n+/).map((p) => p.trim()).filter((p) => p.length > 0)
    : [];

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

      <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={handleClose} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.8)" />
        </Pressable>

        <View style={styles.topBarCenter}>
          {storyState === "ready" && storyData ? (
            <>
              <Text style={[styles.chapterLabel, { color: theme.accent }]}>
                CHAPTER {String(currentPartIndex + 1).padStart(2, "0")}
              </Text>
              <Text style={styles.chapterTitle} numberOfLines={1}>
                {storyData.title}
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.brandingText, { color: theme.accent }]}>INFINITY HEROES</Text>
              <Text style={styles.brandingSubtext}>Bedtime Chronicles</Text>
            </>
          )}
        </View>

        <Pressable onPress={() => Haptics.selectionAsync()} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="share-outline" size={20} color="rgba(255,255,255,0.8)" />
        </Pressable>
      </View>

      {timerRemaining !== null && timerRemaining > 0 && (
        <Animated.View entering={FadeIn.duration(400)} style={styles.timerBar}>
          <Ionicons name="timer-outline" size={14} color={theme.accent} />
          <Text style={[styles.timerText, { color: theme.accent }]}>{formatTimer(timerRemaining)}</Text>
        </Animated.View>
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

            <View style={styles.textSection}>
              {paragraphs.map((paragraph, index) => (
                <Animated.View
                  key={`${currentPartIndex}-${index}`}
                  entering={FadeInDown.duration(400).delay(index * 80)}
                >
                  {index === 0 ? (
                    <Text style={[styles.paragraphText, isSleep && styles.paragraphSleep]}>
                      <Text style={[styles.dropCap, { color: theme.accent }]}>
                        {paragraph.charAt(0)}
                      </Text>
                      {paragraph.slice(1)}
                    </Text>
                  ) : (
                    <Text style={[styles.paragraphText, isSleep && styles.paragraphSleep]}>
                      {paragraph}
                    </Text>
                  )}
                </Animated.View>
              ))}
            </View>

            {storyData && (
              <Animated.View entering={FadeIn.duration(400)} style={styles.progressInfoWrap}>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFillNew, { width: `${progressPct}%`, backgroundColor: theme.accent }]} />
                </View>
                <View style={styles.progressInfoRow}>
                  <Text style={styles.progressInfoText}>{Math.round(progressPct)}% Completed</Text>
                  <Text style={styles.progressInfoText}>
                    {storyData.parts.length - currentPartIndex - 1} {storyData.parts.length - currentPartIndex - 1 === 1 ? "chapter" : "chapters"} remaining
                  </Text>
                </View>
              </Animated.View>
            )}

            {hasChoices && (
              <View style={styles.choicesSection}>
                <Text style={[styles.choicesLabel, { color: theme.accent }]}>
                  What should {hero.name} do next?
                </Text>
                {currentPart!.choices!.map((choice, i) => (
                  <ChoiceButton
                    key={`${currentPartIndex}-choice-${i}`}
                    label={choice}
                    index={i}
                    onPress={() => handleChoiceSelect(i)}
                    colors={theme.choiceColors}
                  />
                ))}
              </View>
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  topBarCenter: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  brandingText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  brandingSubtext: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    marginTop: 1,
  },
  chapterLabel: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
  },
  chapterTitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  timerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
  },
  timerText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
  },
  storyScrollContent: {
    paddingTop: 0,
  },
  textSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  dropCap: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 38,
    lineHeight: 42,
  },
  paragraphText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 18,
    color: "rgba(255,255,255,0.88)",
    lineHeight: 32,
    marginBottom: 22,
    textAlign: "left",
  },
  paragraphSleep: {
    fontSize: 20,
    lineHeight: 38,
    color: "rgba(220, 210, 240, 0.85)",
  },
  progressInfoWrap: {
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 20,
    gap: 10,
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  progressBarFillNew: {
    height: 4,
    borderRadius: 2,
  },
  progressInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressInfoText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },
  choicesSection: { marginTop: 12, gap: 12, paddingHorizontal: 24 },
  choicesLabel: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 4,
  },
  choiceButton: { borderRadius: 16, overflow: "hidden" },
  choiceGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  choiceIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  choiceIndexText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 13,
    color: "#FFF",
  },
  choiceText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
    color: "#FFF",
    flex: 1,
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
