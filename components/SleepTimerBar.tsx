import React from "react";
import { Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";

interface SleepTimerBarProps {
  remainingSeconds: number;
  accent: string;
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function SleepTimerBar({ remainingSeconds, accent }: SleepTimerBarProps) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.timerBar}>
      <Ionicons name="timer-outline" size={14} color={accent} />
      <Text style={[styles.timerText, { color: accent }]}>{formatTimer(remainingSeconds)}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
});
