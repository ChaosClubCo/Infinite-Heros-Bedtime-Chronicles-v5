import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { LoadingOrb } from "@/components/PulsingOrb";
import type { IoniconsName } from "@/constants/heroes";

interface StoryTheme {
  accent: string;
  orbColor: string;
}

interface HeroInfo {
  iconName: IoniconsName;
  color: string;
  name: string;
}

function LoadingDot({ delay, color }: { delay: number; color: string }) {
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  // Shared value (opacity) is a stable Reanimated ref; delay is mount-time config.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width: 8, height: 8, borderRadius: 4, backgroundColor: color },
        animStyle,
      ]}
    />
  );
}

interface StoryGeneratingViewProps {
  storyState: "generating" | "error";
  hero: HeroInfo;
  theme: StoryTheme;
  loadingMsg: number;
  messages: string[];
  onRetry: () => void;
}

export function StoryGeneratingView({
  storyState,
  hero,
  theme,
  loadingMsg,
  messages,
  onRetry,
}: StoryGeneratingViewProps) {
  if (storyState === "generating") {
    return (
      <Animated.View entering={FadeIn.duration(600)} style={s.loadingContainer}>
        <LoadingOrb color={theme.orbColor} />
        <View style={[s.loadingIconWrap, { borderColor: `${theme.accent}30` }]}>
          <Ionicons name={hero.iconName} size={44} color={hero.color} />
        </View>
        <Text style={s.loadingTitle}>{messages[loadingMsg]}</Text>
        <Text style={s.loadingSubtitle}>
          {hero.name} is preparing tonight&apos;s story
        </Text>
        <View style={s.loadingDotsRow}>
          <LoadingDot delay={0} color={theme.accent} />
          <LoadingDot delay={200} color={theme.accent} />
          <LoadingDot delay={400} color={theme.accent} />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(600)} style={s.loadingContainer}>
      <Ionicons name="cloud-offline-outline" size={56} color={Colors.textMuted} />
      <Text style={s.loadingTitle}>Something went wrong</Text>
      <Text style={s.loadingSubtitle}>
        Could not generate the story. Please try again.
      </Text>
      <Pressable
        onPress={onRetry}
        style={[s.retryButton, { backgroundColor: theme.accent }]}
      >
        <Ionicons name="refresh" size={18} color="#FFF" />
        <Text style={s.retryText}>Try Again</Text>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  loadingIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.cardBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 2,
  },
  loadingTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 20,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  loadingSubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  loadingDotsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 12,
  },
  retryText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#FFF",
  },
});
