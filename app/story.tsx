import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { HEROES } from "@/constants/heroes";
import { StarField } from "@/components/StarField";
import { getApiUrl } from "@/lib/query-client";
import { useAuth } from "@/lib/AuthContext";
import { fetch } from "expo/fetch";
import { StoryFull } from "@/constants/types";
import { MODE_THEME, MODE_VOICES, resolveStoryMode, type StoryState } from "@/constants/story-theme";
import { useScreenInsets } from "@/lib/useScreenInsets";
import { useLoadingMessages } from "@/lib/useLoadingMessages";
import { setPendingScenes } from "@/lib/scene-handoff";
import { announceForAccessibility } from "@/lib/announce";
import { useBackgroundMusic } from "@/lib/useBackgroundMusic";
import { useStoryAudio } from "@/lib/useStoryAudio";
import { useSceneGeneration } from "@/lib/useSceneGeneration";
import { useVideoGeneration } from "@/lib/useVideoGeneration";
import { useSleepTimer } from "@/lib/useSleepTimer";
import { useAutoAdvance } from "@/lib/useAutoAdvance";
import { FloatingParticle } from "@/components/FloatingParticle";
import { StoryGeneratingView } from "@/components/StoryGeneratingView";
import { StorySceneDisplay } from "@/components/StorySceneDisplay";
import { StoryPlayerControls } from "@/components/StoryPlayerControls";
import { StoryTopBar } from "@/components/StoryTopBar";
import { SleepTimerBar } from "@/components/SleepTimerBar";
import { StoryTextDisplay } from "@/components/StoryTextDisplay";
import { StoryProgressBar } from "@/components/StoryProgressBar";
import { StoryChoices } from "@/components/StoryChoices";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";

const PARTICLE_COUNT = 6;
const PARTICLE_STAGGER_MS = 800;
const PLAYER_CONTROLS_RESERVED_HEIGHT = 160;

type StoryRouteParams = {
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
  customPrompt?: string;
};

export default function StoryScreen() {
  const params = useLocalSearchParams<StoryRouteParams>();
  const {
    heroId,
    duration,
    voice,
    mode,
    madlibWords,
    soundscape,
    sleepTimer,
    speed: initialSpeed,
    replayJson,
    setting,
    tone,
    childName,
    sidekick,
    problem,
    customPrompt,
  } = params;
  const { topInset, bottomInset } = useScreenInsets();

  const storyMode = resolveStoryMode(mode);
  const theme = MODE_THEME[storyMode];

  const defaultSpeed = initialSpeed || (storyMode === "sleep" ? "gentle" : "medium");

  const modeVoices = MODE_VOICES[storyMode];
  const defaultVoice = voice || modeVoices[0].id;

  const [storyData, setStoryData] = useState<StoryFull | null>(null);
  const [storyState, setStoryState] = useState<StoryState>("generating");
  const [storyErrorKind, setStoryErrorKind] = useState<"error" | "rate_limited">("error");
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const { getIdToken } = useAuth();

  const hero = HEROES.find((h) => h.id === heroId);

  const currentPart = storyData?.parts[currentPartIndex];
  const isLastPart = storyData ? currentPartIndex >= storyData.parts.length - 1 : false;
  const hasChoices = currentPart?.choices && currentPart.choices.length > 0 && !isLastPart;

  const { loadingMsg, messages } = useLoadingMessages(storyMode);

  const { musicMuted, musicLoading, musicPlaying, startBgMusic, stopBgMusic, toggleBgMusic } =
    useBackgroundMusic(storyMode);

  const {
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
  } = useStoryAudio({ currentPart, storyMode, initialVoice: defaultVoice, initialSpeed: defaultSpeed, modeVoices });

  const { sceneImage, sceneLoading, sceneError, loadSceneImage, clearSceneImage, sceneCacheRef } =
    useSceneGeneration({ hero, storyData, storyState, currentPartIndex });

  const { videoEnabled, videoJobId } = useVideoGeneration({ hero, storyData, storyState, currentPartIndex });

  const { timerRemaining, clearSleepTimer } = useSleepTimer({
    sleepTimerParam: sleepTimer,
    storyState,
    storyMode,
    onExpire: () => {
      stopAudio();
      stopBgMusic();
    },
  });

  const advanceToNextPart = useCallback(
    (haptic?: Haptics.ImpactFeedbackStyle) => {
      if (haptic !== undefined) Haptics.impactAsync(haptic);
      stopAudio();
      setCurrentPartIndex((prev) => {
        const next = prev + 1;
        announceForAccessibility(`Part ${next + 1}`);
        return next;
      });
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    },
    [stopAudio],
  );

  const { cancelAutoAdvance } = useAutoAdvance({
    storyState,
    storyMode,
    storyData,
    currentPartIndex,
    onAdvance: advanceToNextPart,
  });

  const teardownPlayback = useCallback(() => {
    stopAudio();
    stopBgMusic();
    clearSleepTimer();
    cancelAutoAdvance();
  }, [stopAudio, stopBgMusic, clearSleepTimer, cancelAutoAdvance]);

  const generateStory = useCallback(async () => {
    if (!hero) return;
    setStoryState("generating");
    setStoryErrorKind("error");
    setStoryData(null);
    setCurrentPartIndex(0);
    clearSceneImage();

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
        try {
          bodyData.madlibWords = JSON.parse(madlibWords);
        } catch (e) {
          console.warn("[story] Failed to parse madlibWords, proceeding without them", e);
        }
      }

      if (storyMode === "sleep" && soundscape) bodyData.soundscape = soundscape;
      if (storyMode === "classic") {
        if (setting) bodyData.setting = setting;
        if (tone) bodyData.tone = tone;
        if (sidekick) bodyData.sidekick = sidekick;
        if (problem) bodyData.problem = problem;
        if (customPrompt) bodyData.customPrompt = customPrompt;
      }
      if (childName) bodyData.childName = childName;

      const token = await getIdToken();
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) {
        let body: { error?: string; retryable?: boolean } | null = null;
        try {
          body = await res.json();
        } catch {
          // Non-JSON error body (e.g. an upstream proxy error page) — fall through to the status-based message.
        }
        const err = new Error(body?.error || `Failed to generate story (${res.status})`) as Error & {
          status?: number;
          retryable?: boolean;
        };
        err.status = res.status;
        err.retryable = body?.retryable;
        throw err;
      }

      const data = await res.json();
      const story = data as StoryFull;
      setStoryData(story);
      setStoryState("ready");
      // Generation is invisible to a screen-reader user until something says so.
      announceForAccessibility(
        `Story ready: ${story.title}. ${story.parts.length} parts.`,
      );
    } catch (error) {
      const status = (error as { status?: number } | undefined)?.status;
      console.error("Story generation error:", { status, error });
      setStoryState("error");
      setStoryErrorKind(status === 429 ? "rate_limited" : "error");
      announceForAccessibility(
        status === 429
          ? "Too many stories right now. Please wait a moment and try again."
          : "The story could not be created. You can try again.",
      );
    }
  }, [
    hero,
    duration,
    storyMode,
    madlibWords,
    soundscape,
    setting,
    tone,
    sidekick,
    problem,
    customPrompt,
    childName,
    clearSceneImage,
    getIdToken,
  ]);

  // Mount-only effect: kick off generation (or replay) and start background music.
  // We intentionally omit the referenced callbacks from deps — they would re-fire
  // this effect mid-playback, restarting the story. Cleanup uses the captured refs,
  // which is the correct behavior on unmount.
  useEffect(() => {
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
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChoiceSelect = (_choiceIndex: number) => {
    advanceToNextPart(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleStoryComplete = () => {
    if (!hero || !storyData) return;
    teardownPlayback();
    // Scene images (base64 data URIs) are handed off in memory — they are far
    // too large to serialize through navigation params.
    setPendingScenes(sceneCacheRef.current);
    router.push({
      pathname: "/completion",
      params: {
        heroId: hero.id,
        mode: storyMode,
        voice: defaultVoice,
        speed: defaultSpeed,
        storyJson: JSON.stringify(storyData),
      },
    });
  };

  const handleClose = () => {
    teardownPlayback();
    router.dismissAll();
  };

  const handlePrevPart = () => {
    if (currentPartIndex > 0) {
      Haptics.selectionAsync();
      stopAudio();
      setCurrentPartIndex((prev) => {
        const next = prev - 1;
        announceForAccessibility(`Part ${next + 1}`);
        return next;
      });
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleNextPart = () => {
    if (storyData && currentPartIndex < storyData.parts.length - 1) {
      Haptics.selectionAsync();
      advanceToNextPart();
    }
  };

  if (!hero) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Hero not found</Text>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
          testID="hero-not-found-back"
          accessibilityRole="button"
          accessibilityLabel="Go back and choose a hero"
        >
          <Text style={styles.errorLink}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isSleep = storyMode === "sleep";

  const progressPct = storyData
    ? ((currentPartIndex + 1) / storyData.parts.length) * 100
    : 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
      <StarField />

      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <FloatingParticle key={i} delay={i * PARTICLE_STAGGER_MS} accent={theme.accent} />
      ))}

      <ResponsiveContainer style={{ flex: 1 }}>
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
          errorKind={storyErrorKind}
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
            contentContainerStyle={[
              styles.storyScrollContent,
              { paddingBottom: bottomInset + PLAYER_CONTROLS_RESERVED_HEIGHT },
            ]}
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
      </ResponsiveContainer>
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