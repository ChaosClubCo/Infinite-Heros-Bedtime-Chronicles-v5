import React from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { StorySeed, ContentTheme } from "@/constants/story-seeds";

interface SeedCardProps {
  seed: StorySeed;
}

const THEME_ACCENTS: Record<ContentTheme, { color: string; bg: string }> = {
  courage: { color: "#F87171", bg: "rgba(248, 113, 113, 0.12)" }, // red
  kindness: { color: "#F472B6", bg: "rgba(244, 114, 182, 0.12)" }, // pink
  friendship: { color: "#60A5FA", bg: "rgba(96, 165, 250, 0.12)" }, // blue
  wonder: { color: "#FBBF24", bg: "rgba(251, 191, 36, 0.12)" }, // amber
  imagination: { color: "#34D399", bg: "rgba(52, 211, 153, 0.12)" }, // emerald
  comfort: { color: "#C084FC", bg: "rgba(192, 132, 252, 0.12)" }, // violet
};

export function SeedCard({ seed }: SeedCardProps) {
  const themeAccent = THEME_ACCENTS[seed.theme] || THEME_ACCENTS.comfort;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/story-details",
      params: {
        storyId: seed.id,
        ...(seed.setting ? { setting: seed.setting } : {}),
        ...(seed.tone ? { tone: seed.tone } : {}),
        ...(seed.sidekick ? { sidekick: seed.sidekick } : {}),
        ...(seed.problem ? { problem: seed.problem } : {}),
      },
    });
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Story Seed: ${seed.title}. Theme: ${seed.theme}. Age: ${seed.ageRange}.`}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.emojiBg, { backgroundColor: themeAccent.bg }]}>
          <Text style={styles.emoji}>{seed.emoji}</Text>
        </View>
        <View style={[styles.themeTag, { backgroundColor: themeAccent.bg }]}>
          <Text style={[styles.themeTagText, { color: themeAccent.color }]}>
            {seed.theme.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {seed.title}
      </Text>
      
      <Text style={styles.blurb} numberOfLines={3}>
        {seed.blurb}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Age {seed.ageRange}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {seed.mode === "sleep" ? "🌙 Sleep" : seed.mode === "madlibs" ? "🤪 Silly" : "📖 Classic"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
    minHeight: 160,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  emojiBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 18,
  },
  themeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  themeTagText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 8,
    letterSpacing: 0.3,
  },
  title: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 13,
    color: "#FFFFFF",
    lineHeight: 18,
    marginBottom: 6,
  },
  blurb: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.55)",
    lineHeight: 16,
    marginBottom: 12,
    flexGrow: 1,
  },
  metaRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: "auto",
  },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 9,
    color: "rgba(255, 255, 255, 0.7)",
  },
});
