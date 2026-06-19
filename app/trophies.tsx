import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn, ZoomIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { StarField } from "@/components/StarField";
import { useProfile } from "@/lib/ProfileContext";
import { EarnedBadge, StreakData, CachedStory } from "@/constants/types";
import { getBadges, getStreak, getStoriesForProfile } from "@/lib/storage";
import { BadgeCard } from "@/components/BadgeCard";
import { getBadgeProgress, BADGE_DEFINITIONS, BadgeState } from "@/lib/badges";
import { getCustomHeroes } from "@/lib/customHeroStorage";
import type { Hero } from "@/constants/heroes";

export default function TrophiesScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const { activeProfile } = useProfile();
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [stories, setStories] = useState<CachedStory[]>([]);
  const [customHeroes, setCustomHeroes] = useState<Hero[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (activeProfile) {
      setIsLoading(true);
      Promise.all([
        getBadges(activeProfile.id).then(setBadges),
        getStreak(activeProfile.id).then(setStreak),
        getStoriesForProfile(activeProfile.id).then(setStories),
        getCustomHeroes().then(setCustomHeroes),
      ])
        .catch((e) => console.error("Failed to load trophy data:", e))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [activeProfile]);

  const earnedIds = new Set(badges.map((b) => b.id));

  // Build the state for progress computation
  const badgeState: BadgeState = activeProfile
    ? {
        profileId: activeProfile.id,
        stories,
        currentStreak: streak?.currentStreak || 0,
        longestStreak: streak?.longestStreak || 0,
        customHeroIds: customHeroes.map((h) => h.id),
      }
    : {
        profileId: "",
        stories: [],
        currentStreak: 0,
        longestStreak: 0,
        customHeroIds: [],
      };

  // Map all badge definitions to their earned state and progress
  const mappedBadges = BADGE_DEFINITIONS.map((def) => {
    const earned = badges.find((b) => b.id === def.id);
    const progress = getBadgeProgress(def.id, badgeState);
    return {
      def,
      earned,
      progress,
    };
  });

  // Sort: earned badges first (sorted by earnedAt descending), then locked badges (sorted by progress ratio descending)
  const sortedMappedBadges = [...mappedBadges].sort((a, b) => {
    if (a.earned && !b.earned) return -1;
    if (!a.earned && b.earned) return 1;
    
    if (a.earned && b.earned) {
      return b.earned.earnedAt - a.earned.earnedAt;
    }

    const pctA = a.progress.target > 0 ? a.progress.current / a.progress.target : 0;
    const pctB = b.progress.target > 0 ? b.progress.current / b.progress.target : 0;
    return pctB - pctA;
  });

  const totalStories = stories.length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#02021a", "#0a0a2e", "#02021a"]}
        style={StyleSheet.absoluteFill}
      />
      <StarField />

      <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.accent} />
        </Pressable>
        <Text style={styles.topTitle}>TROPHY ROOM</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : !activeProfile ? (
          <Animated.View entering={FadeIn.duration(400)} style={styles.noProfile}>
            <Ionicons name="person-outline" size={48} color="rgba(255,255,255,0.15)" />
            <Text style={styles.noProfileTitle}>No Profile Selected</Text>
            <Text style={styles.noProfileSub}>
              Create or select a profile to start earning badges and tracking streaks
            </Text>
          </Animated.View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>TOTAL STORIES</Text>
                <Text style={styles.statValue}>{totalStories}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>CURRENT STREAK</Text>
                <View style={styles.streakRow}>
                  <Text style={styles.statValue}>{streak?.currentStreak || 0}</Text>
                  {(streak?.currentStreak || 0) >= 1 && (
                    <Text style={styles.fireEmoji}>🔥</Text>
                  )}
                </View>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>BEST STREAK</Text>
                <Text style={styles.statValue}>{streak?.longestStreak || 0}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>TOTAL BADGES</Text>
                <Text style={styles.statValue}>{badges.length}</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(200)}>
              <View style={styles.sectionHeader}>
                <Ionicons name="sparkles" size={18} color={Colors.accent} />
                <Text style={styles.sectionLabel}>Cosmic Achievements</Text>
              </View>

              {badges.length === 0 && (
                <View style={styles.emptyBadges}>
                  <Text style={styles.emptyBadgeText}>
                    Complete stories to start earning badges!
                  </Text>
                </View>
              )}

              <View style={styles.badgeGrid}>
                {sortedMappedBadges.map(({ def, earned, progress }, i) => (
                  <Animated.View
                    key={def.id}
                    entering={ZoomIn.duration(300).delay(i * 80)}
                    style={styles.badgeCardWrapper}
                  >
                    <BadgeCard
                      definition={def}
                      earned={earned}
                      progress={progress}
                      index={i}
                    />
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#02021a" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(100,103,242,0.1)",
    borderWidth: 1,
    borderColor: "rgba(100,103,242,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 28,
    color: Colors.accent,
    letterSpacing: 3,
  },
  scrollContent: { paddingHorizontal: 20 },
  noProfile: {
    alignItems: "center",
    paddingVertical: 80,
    gap: 12,
  },
  noProfileTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 20,
    color: "rgba(255,255,255,0.5)",
  },
  noProfileSub: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.3)",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
    marginTop: 8,
  },
  statCard: {
    width: "47%" as `${number}%`,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(100,103,242,0.06)",
    borderWidth: 1,
    borderColor: "rgba(100,103,242,0.15)",
    gap: 4,
  },
  statLabel: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 9,
    color: "rgba(100,103,242,0.7)",
    letterSpacing: 1.5,
  },
  statValue: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 28,
    color: "#FFFFFF",
  },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  fireEmoji: { fontSize: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    color: "#FFFFFF",
  },
  emptyBadges: {
    paddingVertical: 24,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginBottom: 20,
  },
  emptyBadgeText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.3)",
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  badgeCardWrapper: {
    width: "47%" as `${number}%`,
  },
});
