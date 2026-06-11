import React, { useEffect } from "react";
import { Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";

interface FloatingParticleProps {
  delay: number;
  accent: string;
}

export function FloatingParticle({ delay, accent }: FloatingParticleProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const screenWidth = Dimensions.get("window").width;
  const startX = Math.random() * screenWidth;
  const size = 2 + Math.random() * 3;

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-200, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        -1,
        false
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: startX,
          bottom: 100,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: accent,
        },
        animStyle,
      ]}
    />
  );
}
