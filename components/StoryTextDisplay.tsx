import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface StoryTextDisplayProps {
  text: string;
  isSleep: boolean;
  accent: string;
  partIndex: number;
}

export function StoryTextDisplay({ text, isSleep, accent, partIndex }: StoryTextDisplayProps) {
  const paragraphs = text
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
