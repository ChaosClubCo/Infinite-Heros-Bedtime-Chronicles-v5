import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { containsUnsafeContent, SAFE_PLACEHOLDER_TEXT } from "@shared/safety-terms";

interface StoryTextDisplayProps {
  text: string;
  isSleep: boolean;
  accent: string;
  partIndex: number;
  /** Fired if the client fail-safe substitutes placeholder text for this part. */
  onUnsafe?: () => void;
}

export function StoryTextDisplay({ text, isSleep, accent, partIndex, onUnsafe }: StoryTextDisplayProps) {
  // Client-side fail-safe (defense in depth): the server already moderates every
  // story, but if unsafe text ever reaches render (e.g. an older cached story),
  // swap in a gentle placeholder rather than showing it to a child.
  const flagged = useMemo(() => containsUnsafeContent(text), [text]);

  useEffect(() => {
    if (flagged) onUnsafe?.();
  }, [flagged, onUnsafe]);

  const paragraphs = (flagged ? SAFE_PLACEHOLDER_TEXT : text)
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <View style={styles.textSection}>
      {paragraphs.map((paragraph, index) => (
        <Animated.View
          key={`${partIndex}-${index}`}
          entering={FadeInDown.duration(400).delay(index * 80)}
        >
          {index === 0 ? (
            <Text style={[styles.paragraphText, isSleep && styles.paragraphSleep]}>
              <Text style={[styles.dropCap, { color: accent }]}>
                {paragraph.charAt(0)}
              </Text>
              {paragraph.slice(1)}
            </Text>
          ) : (
            <Text style={[styles.paragraphText, isSleep && styles.paragraphSleep]}>
              {paragraph}
            </Text>
          )}
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  textSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  dropCap: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 38,
    lineHeight: 42,
  },
  paragraphText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 18,
    color: "rgba(255,255,255,0.88)",
    lineHeight: 32,
    marginBottom: 22,
    textAlign: "left",
  },
  paragraphSleep: {
    fontSize: 20,
    lineHeight: 38,
    color: "rgba(220, 210, 240, 0.85)",
  },
});
