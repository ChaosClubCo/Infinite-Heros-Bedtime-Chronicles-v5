import React from "react";
import { View, Text, StyleSheet, Image, Dimensions, Platform } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { StarField } from "@/components/StarField";
import Colors from "@/constants/colors";
import { useSettings } from "@/lib/SettingsContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface OnboardingSlideProps {
  image: any;
  title: string;
  body: string;
}

export function OnboardingSlide({ image, title, body }: OnboardingSlideProps) {
  const { settings } = useSettings();
  const reducedMotion = settings?.reducedMotion ?? false;

  if (reducedMotion) {
    return (
      <View style={styles.container}>
        <StarField />
        <View style={styles.content}>
          <View style={styles.imageContainer}>
            <Image source={image} style={styles.image} resizeMode="contain" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.body}>{body}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StarField />
      <Animated.View entering={FadeIn.duration(800)} style={styles.content}>
        <View style={styles.imageContainer}>
          <Image source={image} style={styles.image} resizeMode="contain" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingTop: Platform.OS === "web" ? 80 : 100,
    paddingBottom: 140,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    maxHeight: SCREEN_HEIGHT * 0.45,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  textContainer: {
    alignItems: "center",
    marginTop: 30,
    gap: 12,
  },
  title: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 28,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 36,
  },
  body: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 12,
  },
});
