import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useMotionPreference } from '@/lib/useMotionPreference';

interface StarProps {
  size: number;
  top: number;
  left: number;
  delay: number;
  reducedMotion: boolean;
}

function Star({ size, top, left, delay, reducedMotion }: StarProps) {
  // Settle at a mid opacity when motion is reduced: the starfield still reads
  // as a night sky, it just stops twinkling.
  const opacity = useSharedValue(reducedMotion ? 0.6 : 0.2);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 0.6;
      return;
    }
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 1500 + Math.random() * 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  // Shared value (opacity) is a stable Reanimated ref; delay is mount-time config.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#FFFFFF',
          top,
          left,
        },
        animatedStyle,
      ]}
    />
  );
}

const { width, height } = Dimensions.get('window');

const STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  size: Math.random() * 2.5 + 1,
  top: Math.random() * height,
  left: Math.random() * width,
  delay: Math.random() * 3000,
}));

export function StarField() {
  const { reducedMotion } = useMotionPreference();
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      // Purely decorative: announcing 40 stars would bury the screen's real
      // content for a screen-reader user.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {STARS.map((star) => (
        <Star
          key={star.id}
          size={star.size}
          top={star.top}
          left={star.left}
          delay={star.delay}
          reducedMotion={reducedMotion}
        />
      ))}
    </View>
  );
}
