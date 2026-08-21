import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface StoryTopBarProps {
  topInset: number;
  isReady: boolean;
  storyTitle?: string;
  currentPartIndex: number;
  accent: string;
  onClose: () => void;
}

export function StoryTopBar({ topInset, isReady, storyTitle, currentPartIndex, accent, onClose }: StoryTopBarProps) {
  return (
    <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
      <Pressable
        onPress={onClose}
        hitSlop={12}
        style={styles.iconBtn}
        testID="story-close-btn"
        accessibilityRole="button"
        accessibilityLabel="Close story"
      >
        <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.8)" />
      </Pressable>

      <View
        style={styles.topBarCenter}
        accessible
        accessibilityRole="header"
        accessibilityLabel={
          isReady
            ? `Chapter ${currentPartIndex + 1}${storyTitle ? `, ${storyTitle}` : ""}`
            : "Infinity Heroes, Bedtime Chronicles"
        }
      >
        {isReady ? (
          <>
            <Text style={[styles.chapterLabel, { color: accent }]}>
              CHAPTER {String(currentPartIndex + 1).padStart(2, "0")}
            </Text>
            <Text style={styles.chapterTitle} numberOfLines={1}>
              {storyTitle}
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.brandingText, { color: accent }]}>INFINITY HEROES</Text>
            <Text style={styles.brandingSubtext}>Bedtime Chronicles</Text>
          </>
        )}
      </View>

      {/* Balances the back button so the title stays optically centred. */}
      <View style={styles.iconBtnSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
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
  iconBtnSpacer: { width: 40, height: 40 },
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
});
