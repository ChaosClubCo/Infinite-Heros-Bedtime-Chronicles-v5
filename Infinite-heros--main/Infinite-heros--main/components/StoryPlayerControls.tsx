import React from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp } from "react-native-reanimated";

const SPEED_LABELS: Record<string, string> = {
  gentle: "Gentle",
  medium: "Medium",
  normal: "Normal",
};

interface StoryTheme {
  accent: string;
  choiceColors: [string, string][];
}

interface VoiceInfo {
  id: string;
  label: string;
  accent: string;
}

interface StoryPlayerControlsProps {
  isSpeaking: boolean;
  audioLoading: boolean;
  audioDuration: number;
  audioPosition: number;
  playbackSpeed: string;
  currentVoice: string;
  modeVoices: VoiceInfo[];
  currentPartIndex: number;
  isLastPart: boolean;
  storyMode: string;
  theme: StoryTheme;
  musicMuted: boolean;
  musicLoading: boolean;
  musicPlaying: boolean;
  bottomInset: number;
  onSpeedCycle: () => void;
  onVoiceCycle: () => void;
  onPrevPart: () => void;
  onNextPart: () => void;
  onSpeakToggle: () => void;
  onToggleMusic: () => void;
  onComplete: () => void;
}

export function StoryPlayerControls({
  isSpeaking,
  audioLoading,
  audioDuration,
  audioPosition,
  playbackSpeed,
  currentVoice,
  modeVoices,
  currentPartIndex,
  isLastPart,
  storyMode,
  theme,
  musicMuted,
  musicLoading,
  musicPlaying,
  bottomInset,
  onSpeedCycle,
  onVoiceCycle,
  onPrevPart,
  onNextPart,
  onSpeakToggle,
  onToggleMusic,
  onComplete,
}: StoryPlayerControlsProps) {
  const isSleep = storyMode === "sleep";
  const finishLabel = isSleep
    ? "Sweet Dreams"
    : storyMode === "madlibs"
    ? "That Was Hilarious!"
    : "Complete Story";

  return (
    <Animated.View
      entering={FadeInUp.duration(400)}
      style={[s.bottomControlBar, { paddingBottom: bottomInset + 12 }]}
    >
      {isSpeaking && audioDuration > 0 && (
        <View style={s.seekBarWrap}>
          <View style={s.seekBarTrack}>
            <View
              style={[
                s.seekBarFill,
                {
                  width: `${audioDuration > 0 ? (audioPosition / audioDuration) * 100 : 0}%`,
                  backgroundColor: theme.accent,
                },
              ]}
            />
          </View>
          <View style={s.seekBarTimes}>
            <Text style={s.seekBarTime}>
              {Math.floor(audioPosition / 60000)}:
              {String(Math.floor((audioPosition % 60000) / 1000)).padStart(2, "0")}
            </Text>
            <Text style={s.seekBarTime}>
              {Math.floor(audioDuration / 60000)}:
              {String(Math.floor((audioDuration % 60000) / 1000)).padStart(2, "0")}
            </Text>
          </View>
        </View>
      )}

      <View style={s.controlBar}>
        <Pressable
          onPress={onSpeedCycle}
          hitSlop={8}
          style={s.controlBarBtn}
          testID="speed-cycle-btn"
        >
          <Text style={[s.controlAaText, { color: theme.accent }]}>
            {SPEED_LABELS[playbackSpeed]}
          </Text>
        </Pressable>

        <Pressable
          onPress={onVoiceCycle}
          hitSlop={8}
          style={s.controlBarBtn}
          testID="voice-cycle-btn"
        >
          <Ionicons name="mic-outline" size={16} color={theme.accent} />
          <Text style={[s.controlVoiceText, { color: theme.accent }]}>
            {modeVoices.find((v) => v.id === currentVoice)?.accent === "British" ? "GB" : "US"}
          </Text>
        </Pressable>

        <Pressable
          onPress={onPrevPart}
          hitSlop={8}
          style={s.controlBarBtn}
          disabled={currentPartIndex === 0}
        >
          <Ionicons
            name="play-back"
            size={20}
            color={
              currentPartIndex === 0
                ? "rgba(255,255,255,0.2)"
                : "rgba(255,255,255,0.6)"
            }
          />
        </Pressable>

        <Pressable
          onPress={onSpeakToggle}
          hitSlop={8}
          style={[s.controlPlayBtn, { backgroundColor: theme.accent }]}
          disabled={audioLoading}
        >
          {audioLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons
              name={isSpeaking ? "pause" : "play"}
              size={24}
              color="#FFF"
              style={!isSpeaking ? { marginLeft: 2 } : undefined}
            />
          )}
        </Pressable>

        <Pressable
          onPress={onNextPart}
          hitSlop={8}
          style={s.controlBarBtn}
          disabled={isLastPart}
        >
          <Ionicons
            name="play-forward"
            size={20}
            color={isLastPart ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)"}
          />
        </Pressable>

        <Pressable onPress={onSpeakToggle} hitSlop={8} style={s.controlBarBtn}>
          <Ionicons
            name="headset-outline"
            size={20}
            color={isSpeaking ? theme.accent : "rgba(255,255,255,0.5)"}
          />
        </Pressable>

        <Pressable
          onPress={onToggleMusic}
          hitSlop={8}
          style={s.controlBarBtn}
          disabled={musicLoading}
        >
          {musicLoading ? (
            <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" />
          ) : (
            <View style={s.musicBtnWrap}>
              <Ionicons
                name={musicMuted ? "musical-note-outline" : "musical-notes"}
                size={20}
                color={
                  musicMuted ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.6)"
                }
              />
              {musicPlaying && !musicMuted && <View style={s.musicDot} />}
            </View>
          )}
        </Pressable>
      </View>

      {isLastPart && (
        <Pressable
          onPress={onComplete}
          style={({ pressed }) => [
            s.finishButton,
            { transform: [{ scale: pressed ? 0.95 : 1 }], marginTop: 8 },
          ]}
          testID="finish-story-button"
        >
          <LinearGradient
            colors={[theme.accent, theme.choiceColors[0][1]]}
            style={s.finishButtonGradient}
          >
            <Ionicons name="sparkles" size={20} color="#FFF" />
            <Text style={s.finishButtonText}>{finishLabel}</Text>
          </LinearGradient>
        </Pressable>
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  bottomControlBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "rgba(10, 10, 30, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    zIndex: 50,
  },
  controlBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  controlBarBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  controlAaText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
  },
  controlVoiceText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 10,
    marginTop: 1,
  },
  controlPlayBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  musicBtnWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  musicDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#22C55E",
    marginTop: 2,
  },
  finishButton: {
    borderRadius: 28,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  finishButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  finishButtonText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    color: "#FFF",
  },
  seekBarWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  seekBarTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  seekBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  seekBarTimes: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  seekBarTime: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
  },
});
