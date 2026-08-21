import React, { useEffect } from "react";
import { ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useMotionPreference } from "@/lib/useMotionPreference";

interface PulsingOrbProps {
  color: string;
  size: number;
  style?: ViewStyle;
  maxScale?: number;
  duration?: number;
  minOpacity?: number;
  maxOpacity?: number;
}

export function PulsingOrb({
  color,
  size,
  style,
  maxScale = 1.3,
  duration = 2500,
  minOpacity = 0.1,
  maxOpacity = 0.4,
}: PulsingOrbProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(maxOpacity);
  const { reducedMotion } = useMotionPreference();

  useEffect(() => {
    if (reducedMotion) {
      // Hold the orb at its resting size and full opacity: the glow stays part
      // of the composition, it just stops breathing.
      scale.value = 1;
      opacity.value = maxOpacity;
      return;
    }
    scale.value = withRepeat(
      withTiming(maxScale, { duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    opacity.value = withRepeat(
      withTiming(minOpacity, { duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  // Shared values (scale, opacity) are stable Reanimated refs; animation props
  // (maxScale, duration, minOpacity) are treated as mount-time configuration.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute" as const,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
        animStyle,
      ]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

export function LoadingOrb({ color }: { color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);
  const { reducedMotion } = useMotionPreference();

  useEffect(() => {
    if (reducedMotion) {
      scale.value = 1;
      opacity.value = 0.3;
      return;
    }
    scale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.15, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  // Shared values (scale, opacity) are stable Reanimated refs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute" as const,
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: color,
        },
        animStyle,
      ]}
    />
  );
}
