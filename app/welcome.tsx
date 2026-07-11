import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { setOnboardingComplete } from "@/lib/storage";
import { useSettings } from "@/lib/SettingsContext";
import { OnboardingSlide } from "@/components/OnboardingSlide";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
  {
    image: require("../assets/onboarding/01-meet-heroes.png"),
    title: "Meet Your Heroes",
    body: "Create your own cosmic hero and embark on magical bedtime adventures together.",
  },
  {
    image: require("../assets/onboarding/02-choose-adventure.png"),
    title: "Choose Your Adventure",
    body: "Select story settings, tones, and options to customize every bedtime story.",
  },
  {
    image: require("../assets/onboarding/03-narration.png"),
    title: "Bedtime Narration",
    body: "Listen to cozy voice narration with calming background music as you drift off.",
  },
  {
    image: require("../assets/onboarding/04-sleep-safe.png"),
    title: "Safe & Calm Sleep",
    body: "Child-safe content designed for peaceful nights, relaxation, and sweet dreams.",
  },
];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const { settings } = useSettings();
  const reducedMotion = settings?.reducedMotion ?? false;

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleSkip = async () => {
    Haptics.selectionAsync();
    await setOnboardingComplete();
    router.replace("/(tabs)");
  };

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: !reducedMotion,
      });
      setCurrentIndex(nextIndex);
    } else {
      await setOnboardingComplete();
      // Land on Home, then open Quick Create on top so the family can make
      // their first story right away — closing the modal falls through to Home.
      router.replace("/(tabs)");
      router.push("/quick-create");
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < SLIDES.length) {
      setCurrentIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#02021a", "#05051e", "#0a0a2e", "#05051e"]}
        locations={[0, 0.3, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={({ item }) => (
          <OnboardingSlide image={item.image} title={item.title} body={item.body} />
        )}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        bounces={false}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Header Row (Skip Button) */}
      {currentIndex < SLIDES.length - 1 && (
        <View style={[styles.topRow, { paddingTop: topInset + 8 }]}>
          <Pressable onPress={handleSkip} hitSlop={12} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.4)" />
          </Pressable>
        </View>
      )}

      {/* Bottom Control Bar */}
      <View style={[styles.bottomBar, { paddingBottom: bottomInset + 24 }]}>
        <View style={styles.dotContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.nextBtn,
            { transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
          testID={currentIndex === SLIDES.length - 1 ? "get-started-btn" : "next-btn"}
        >
          <LinearGradient
            colors={["#6366f1", "#4f46e5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextBtnGradient}
          >
            <Text style={styles.nextBtnText}>
              {currentIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
            </Text>
            <Ionicons
              name={currentIndex === SLIDES.length - 1 ? "sparkles" : "arrow-forward"}
              size={18}
              color="#FFF"
            />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#02021a",
  },
  topRow: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  skipText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  dotContainer: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 20,
    backgroundColor: Colors.accent,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  nextBtn: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  nextBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 22,
  },
  nextBtnText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#FFF",
  },
});
