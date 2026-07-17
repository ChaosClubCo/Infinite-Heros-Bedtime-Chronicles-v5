import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

interface StoryProgressBarProps {
  progressPct: number;
  partsRemaining: number;
  accent: string;
}

export function StoryProgressBar({ progressPct, partsRemaining, accent }: StoryProgressBarProps) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.progressInfoWrap}>
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFillNew, { width: `${progressPct}%`, backgroundColor: accent }]} />
      </View>
      <View style={styles.progressInfoRow}>
        <Text style={styles.progressInfoText}>{Math.round(progressPct)}% Completed</Text>
        <Text style={styles.progressInfoText}>
          {partsRemaining} {partsRemaining === 1 ? "chapter" : "chapters"} remaining
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
});
