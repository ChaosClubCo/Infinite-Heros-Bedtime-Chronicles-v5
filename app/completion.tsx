import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { AnimatedView } from "@/components/AnimatedView";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import * as Haptics from "expo-haptics";
import {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { HEROES } from "@/constants/heroes";
import type { IoniconsName } from "@/constants/heroes";
import { MODE_THEME, resolveStoryMode, DEFAULT_STORY_VOICE, DEFAULT_STORY_SPEED } from "@/constants/story-theme";
import { useScreenInsets } from "@/lib/useScreenInsets";
import { StarField } from "@/components/StarField";
import { StoryFull, EarnedBadge } from "@/constants/types";
import { saveStory, saveStoryWithProfile, saveStoryScene, updateStreak, checkAndAwardBadges, markStoryRead, updateFeedback } from "@/lib/storage";
import { queueInteraction } from "@/lib/sync-queue";
import { takePendingScenes } from "@/lib/scene-handoff";
import { useProfile } from "@/lib/ProfileContext";
import { useSettings } from "@/lib/SettingsContext";
import { runSync } from "@/lib/sync/runSync";

// Colors alias MODE_THEME (constants/story-theme.ts) — only the completion
// copy (label, sublabel) lives here.
const MODE_THEMES = {
  classic: {
    accent: MODE_THEME.classic.accent,
    accentDark: MODE_THEME.classic.choiceColors[0][1],
    gradient: MODE_THEME.classic.gradient,
    label: "STORY COMPLETE",
    sublabel: "A heroic tale well told",
  },
  madlibs: {
    accent: MODE_THEME.madlibs.accent,
    accentDark: MODE_THEME.madlibs.choiceColors[0][1],
    gradient: MODE_THEME.madlibs.gradient,
    label: "THAT WAS HILARIOUS!",
    sublabel: "Your wacky words made magic",
  },
  sleep: {
    accent: MODE_THEME.sleep.accent,
    accentDark: MODE_THEME.sleep.choiceColors[0][1],
    gradient: MODE_THEME.sleep.gradient,
    label: "SWEET DREAMS",
    sublabel: "Time to drift off to sleep",
  },
};

function FloatingStar({ delay, x, y, color }: { delay: number; x: number; y: number; color: string }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ), -1, false
    ));
    scale.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ), -1, false
    ));
  // Shared values (opacity, scale) are stable Reanimated refs; delay is mount-time
  // configuration that does not change. Intentional mount-only animation setup.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedView style={[{ position: "absolute", left: `${x}%`, top: `${y}%` } as Record<string, string | number>, animStyle]}>
      <Ionicons name="star" size={16} color={color} />
    </AnimatedView>
  );
}

function PulsingBadge({ emoji, color }: { emoji: string; color: string }) {
  const pulseScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);
  const ringScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withDelay(500, withRepeat(
      withSequence(
        withSpring(1.08, { damping: 6, stiffness: 100 }),
        withSpring(1, { damping: 6, stiffness: 100 })
      ), -1, false
    ));
    ringOpacity.value = withDelay(500, withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1200 }),
        withTiming(0, { duration: 1200 })
      ), -1, false
    ));
    ringScale.value = withDelay(500, withRepeat(
      withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(1.6, { duration: 2400 })
      ), -1, false
    ));
  // Shared values (pulseScale, ringOpacity, ringScale) are stable Reanimated refs.
  // Intentional mount-only animation setup.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <View style={styles.badgeWrapper}>
      <AnimatedView style={[styles.badgeRing, { borderColor: color }, ringStyle]} />
      <AnimatedView style={[styles.badgeCircle, { borderColor: `${color}50`, backgroundColor: `${color}12` }, badgeStyle]}>
        <Text style={styles.badgeEmoji}>{emoji}</Text>
      </AnimatedView>
    </View>
  );
}

function ExpandableExtraCard({
  label,
  title,
  icon,
  iconColor,
  iconBg,
  body,
  expanded,
  onToggle,
}: {
  label: string;
  title: string;
  icon: IoniconsName;
  iconColor: string;
  iconBg: string;
  body: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable onPress={onToggle} style={styles.extraCard}>
      <View style={styles.extraCardHeader}>
        <View style={[styles.extraIconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View style={styles.extraCardHeaderText}>
          <Text style={styles.extraCardLabel}>{label}</Text>
          <Text style={styles.extraCardTitle}>{title}</Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={Colors.textMuted}
        />
      </View>
      {expanded && (
        <AnimatedView entering={FadeIn.duration(300)}>
          <Text style={styles.extraCardBody}>{body}</Text>
        </AnimatedView>
      )}
    </Pressable>
  );
}

export default function CompletionScreen() {
  const { heroId, mode, voice, speed, storyJson } = useLocalSearchParams<{
    heroId: string;
    mode: string;
    voice: string;
    speed: string;
    storyJson: string;
  }>();
  const { topInset, bottomInset } = useScreenInsets();

  const hero = HEROES.find((h) => h.id === heroId);
  const theme = MODE_THEMES[resolveStoryMode(mode)];
  const [saved, setSaved] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [newBadges, setNewBadges] = useState<EarnedBadge[]>([]);
  const [savedStoryId, setSavedStoryId] = useState<string>("");
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const { activeProfile } = useProfile();
  const { settings } = useSettings();
  // Ref so the mount-only completion effect can read the latest opt-in flag
  // without becoming a dependency (which would re-run completion tracking).
  const syncEnabledRef = useRef(settings.cloudSyncEnabled);
  useEffect(() => {
    syncEnabledRef.current = settings.cloudSyncEnabled;
  }, [settings.cloudSyncEnabled]);

  const storyData = useMemo<StoryFull | null>(() => {
    try {
      return storyJson ? (JSON.parse(storyJson) as StoryFull) : null;
    } catch {
      return null;
    }
  }, [storyJson]);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Scene images arrive via the in-memory handoff (see lib/scene-handoff.ts);
    // take them exactly once so they never leak into a later completion.
    const scenes = takePendingScenes();

    const trackCompletion = async () => {
      if (!activeProfile || !hero) return;
      try {
        await updateStreak(activeProfile.id);
        let storyId = `story_${Date.now()}`;
        if (storyData) {
          storyId = await saveStoryWithProfile(
            storyData,
            hero.id,
            mode || "classic",
            activeProfile.id,
            undefined,
            voice || DEFAULT_STORY_VOICE,
            speed || DEFAULT_STORY_SPEED,
          );
          setSavedStoryId(storyId);
          if (scenes) {
            // best-effort: a scene-image write failure must never abort the
            // rest of completion tracking (read marking, streaks, badges)
            try {
              for (const [key, imageDataUri] of Object.entries(scenes)) {
                await saveStoryScene(storyId, Number(key), imageDataUri);
              }
            } catch (e) {
              if (__DEV__) console.log("Error saving story scenes:", e);
            }
          }
          // best-effort: never block badge awarding on a storage write failure
          try {
            await markStoryRead(storyId);
          } catch (e) {
            if (__DEV__) console.log("Error marking story as read:", e);
          }
          void queueInteraction("story_completion", storyId);
        }
        const earned = await checkAndAwardBadges(
          activeProfile.id,
          storyId,
          mode || "classic",
          hero.id,
        );
        if (earned.length > 0) {
          setNewBadges(earned);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (e) {
        if (__DEV__) console.log("Error tracking completion:", e);
      }
      // A new story + progress just landed locally — push it up (best-effort,
      // no-op unless cloud sync is enabled and signed in).
      void runSync(syncEnabledRef.current);
    };
    trackCompletion();
  // Intentional mount-only effect: completion tracking runs exactly once when
  // this screen mounts. Props (storyData, hero, etc.) are route params that
  // don't change during the lifecycle of this screen.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveToJar = useCallback(async () => {
    if (!storyData || !hero || saved) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await saveStory(storyData, hero.id, mode || "classic", undefined, voice || DEFAULT_STORY_VOICE, speed || DEFAULT_STORY_SPEED);
    setSaved(true);
  }, [storyData, hero, mode, saved, voice, speed]);

  const handleNewStory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.dismissAll();
  };

  const toggleSection = (section: string) => {
    Haptics.selectionAsync();
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (!hero) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Pressable onPress={() => router.dismissAll()}>
          <Text style={[styles.linkText, { color: theme.accent }]}>Go Home</Text>
        </Pressable>
      </View>
    );
  }

  const badge = storyData?.rewardBadge;
  const vocabWord = storyData?.vocabWord;
  const joke = storyData?.joke;
  const lesson = storyData?.lesson;
  const tomorrowHook = storyData?.tomorrowHook;

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFill} />
      <StarField />
      <FloatingStar delay={0} x={15} y={20} color={theme.accent} />
      <FloatingStar delay={300} x={75} y={15} color={theme.accent} />
      <FloatingStar delay={600} x={25} y={50} color={theme.accent} />
      <FloatingStar delay={900} x={80} y={40} color={theme.accent} />
      <FloatingStar delay={1200} x={50} y={65} color={theme.accent} />

      <ResponsiveContainer style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 20, paddingBottom: bottomInset + 40 }]}
          showsVerticalScrollIndicator={false}
        >
        {badge && (
          <AnimatedView entering={FadeIn.duration(1000)} style={styles.badgeArea}>
            <PulsingBadge emoji={badge.emoji} color={theme.accent} />
            <Text style={[styles.badgeTitle, { color: theme.accent }]}>{badge.title}</Text>
            <Text style={styles.badgeDescription}>{badge.description}</Text>
          </AnimatedView>
        )}

        {newBadges.length > 0 && (
          <AnimatedView entering={FadeInDown.duration(800).delay(300)} style={styles.newBadgesArea}>
            <Text style={[styles.newBadgesTitle, { color: "#FFD54F" }]}>
              {newBadges.length === 1 ? "New Badge Earned!" : `${newBadges.length} New Badges!`}
            </Text>
            <View style={styles.newBadgesRow}>
              {newBadges.map((b) => (
                <View key={b.id} style={styles.newBadgeItem}>
                  <Text style={{ fontSize: 28 }}>{b.emoji}</Text>
                  <Text style={styles.newBadgeLabel}>{b.title}</Text>
                </View>
              ))}
            </View>
          </AnimatedView>
        )}

        <AnimatedView entering={FadeInDown.duration(800).delay(400)} style={styles.textArea}>
          <Text style={[styles.completionLabel, { color: theme.accent }]}>
            {theme.label}
          </Text>
          <Text style={styles.completionTitle}>
            {storyData?.title || "Great Adventure!"}
          </Text>
          <Text style={styles.completionSublabel}>{theme.sublabel}</Text>
        </AnimatedView>

        <AnimatedView entering={FadeInDown.duration(600).delay(600)} style={styles.extrasArea}>
          {vocabWord && (
            <ExpandableExtraCard
              label="New Word"
              title={vocabWord.word}
              icon="book-outline"
              iconColor={theme.accent}
              iconBg={`${theme.accent}18`}
              body={vocabWord.definition}
              expanded={expandedSection === "vocab"}
              onToggle={() => toggleSection("vocab")}
            />
          )}

          {joke && (
            <ExpandableExtraCard
              label="Story Joke"
              title="Tap to reveal"
              icon="happy-outline"
              iconColor="#F59E0B"
              iconBg="rgba(245, 158, 11, 0.15)"
              body={joke}
              expanded={expandedSection === "joke"}
              onToggle={() => toggleSection("joke")}
            />
          )}

          {lesson && (
            <ExpandableExtraCard
              label="Today's Lesson"
              title="What we learned"
              icon="heart-outline"
              iconColor="#10B981"
              iconBg="rgba(16, 185, 129, 0.15)"
              body={lesson}
              expanded={expandedSection === "lesson"}
              onToggle={() => toggleSection("lesson")}
            />
          )}

          {tomorrowHook && (
            <View style={[styles.tomorrowCard, { borderColor: `${theme.accent}22`, backgroundColor: `${theme.accent}08` }]}>
              <Ionicons name="telescope-outline" size={18} color={theme.accent} />
              <Text style={[styles.tomorrowText, { color: theme.accent }]}>{tomorrowHook}</Text>
            </View>
          )}
        </AnimatedView>

        <AnimatedView entering={FadeInUp.duration(600).delay(800)} style={styles.actionsArea}>
          {savedStoryId ? (
            <View style={styles.feedbackArea}>
              <Text style={styles.feedbackLabel}>How was this story?</Text>
              <View style={styles.feedbackRow}>
                {([
                  { emoji: "😍", label: "Loved it!", rating: 5 },
                  { emoji: "😊", label: "Good", rating: 4 },
                  { emoji: "🤔", label: "Just OK", rating: 3 },
                ] as const).map(({ emoji, label, rating }) => (
                  <Pressable
                    key={rating}
                    onPress={async () => {
                      if (feedbackRating !== null) return;
                      Haptics.selectionAsync();
                      setFeedbackRating(rating);
                      await updateFeedback(savedStoryId, rating, emoji);
                    }}
                    style={[
                      styles.feedbackBtn,
                      feedbackRating === rating && { borderColor: theme.accent, backgroundColor: `${theme.accent}15` },
                      feedbackRating !== null && feedbackRating !== rating && styles.feedbackBtnDim,
                    ]}
                    testID={`feedback-${rating}`}
                  >
                    <Text style={styles.feedbackEmoji}>{emoji}</Text>
                    <Text style={styles.feedbackBtnLabel}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
          <Pressable
            onPress={handleSaveToJar}
            disabled={saved}
            style={({ pressed }) => [
              styles.saveButton,
              { borderColor: saved ? "rgba(16, 185, 129, 0.2)" : `${theme.accent}30` },
              saved && styles.saveButtonDone,
              { transform: [{ scale: pressed && !saved ? 0.96 : 1 }] },
            ]}
            testID="save-to-jar-button"
          >
            <Ionicons
              name={saved ? "checkmark-circle" : "archive-outline"}
              size={20}
              color={saved ? "#10B981" : theme.accent}
            />
            <Text style={[styles.saveButtonText, { color: saved ? "#10B981" : theme.accent }]}>
              {saved ? "Saved to Memory Jar" : "Save to Memory Jar"}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleNewStory}
            style={({ pressed }) => [
              styles.primaryButton,
              { shadowColor: theme.accent },
              { transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}
            testID="new-story-button"
          >
            <LinearGradient
              colors={[theme.accent, theme.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Ionicons name="sparkles" size={20} color="#FFF" />
              <Text style={styles.primaryButtonText}>New Adventure</Text>
            </LinearGradient>
          </Pressable>
        </AnimatedView>
      </ScrollView>
      </ResponsiveContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  centered: { justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingHorizontal: 24 },
  badgeArea: { alignItems: "center", marginBottom: 24 },
  badgeWrapper: {
    width: 120, height: 120, alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  badgeRing: {
    position: "absolute",
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 2,
  },
  badgeCircle: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  badgeEmoji: { fontSize: 44 },
  badgeTitle: {
    fontFamily: "PlusJakartaSans_800ExtraBold", fontSize: 20,
    textAlign: "center", marginBottom: 4,
  },
  badgeDescription: {
    fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: Colors.textSecondary,
    textAlign: "center",
  },
  textArea: { alignItems: "center", marginBottom: 24 },
  completionLabel: {
    fontFamily: "PlusJakartaSans_700Bold", fontSize: 12,
    letterSpacing: 3, marginBottom: 8,
  },
  completionTitle: {
    fontFamily: "PlusJakartaSans_800ExtraBold", fontSize: 28, color: Colors.textPrimary,
    textAlign: "center", lineHeight: 36,
  },
  completionSublabel: {
    fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: Colors.textSecondary,
    marginTop: 6,
  },
  extrasArea: { gap: 12, marginBottom: 28 },
  extraCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.cardBorder,
    padding: 16,
  },
  extraCardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  extraIconWrap: {
    width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
  },
  extraCardHeaderText: { flex: 1 },
  extraCardLabel: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11, color: Colors.textMuted, letterSpacing: 1 },
  extraCardTitle: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: Colors.textPrimary },
  extraCardBody: {
    fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: Colors.textSecondary,
    lineHeight: 24, marginTop: 12, paddingLeft: 48,
  },
  tomorrowCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderRadius: 16, borderWidth: 1,
    padding: 16,
  },
  tomorrowText: {
    fontFamily: "PlusJakartaSans_500Medium", fontSize: 14,
    flex: 1, lineHeight: 22, fontStyle: "italic",
  },
  actionsArea: { gap: 12 },
  saveButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 28, borderWidth: 1.5,
    paddingVertical: 16,
  },
  saveButtonDone: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
  },
  saveButtonText: {
    fontFamily: "PlusJakartaSans_700Bold", fontSize: 16,
  },
  primaryButton: {
    borderRadius: 28, overflow: "hidden", elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12,
  },
  primaryButtonGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 18, paddingHorizontal: 32,
  },
  primaryButtonText: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: "#FFF" },
  linkText: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 16 },
  feedbackArea: {
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  feedbackLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  feedbackRow: {
    flexDirection: "row",
    gap: 10,
  },
  feedbackBtn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  feedbackBtnDim: {
    opacity: 0.35,
  },
  feedbackEmoji: {
    fontSize: 24,
  },
  feedbackBtnLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
  },
  newBadgesArea: {
    alignItems: "center", marginBottom: 20,
    paddingVertical: 16, paddingHorizontal: 20,
    borderRadius: 20, backgroundColor: "rgba(255,215,79,0.06)",
    borderWidth: 1.5, borderColor: "rgba(255,215,79,0.15)",
  },
  newBadgesTitle: {
    fontFamily: "PlusJakartaSans_800ExtraBold", fontSize: 16,
    letterSpacing: 1, marginBottom: 12,
  },
  newBadgesRow: {
    flexDirection: "row", flexWrap: "wrap",
    justifyContent: "center", gap: 16,
  },
  newBadgeItem: { alignItems: "center", gap: 4 },
  newBadgeLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11,
    color: "rgba(255,255,255,0.6)",
  },
});
