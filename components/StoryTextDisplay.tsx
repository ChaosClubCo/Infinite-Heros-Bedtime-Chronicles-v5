import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { containsUnsafeContent, SAFE_PLACEHOLDER_TEXT } from "@shared/safety-terms";
import { useSettings, type AppSettings } from "@/lib/SettingsContext";

/**
 * Multipliers for the in-app "Story Text Size" setting.
 *
 * These sit *on top of* the OS font scale rather than replacing it: RN's
 * `allowFontScaling` defaults to true and is deliberately never disabled in
 * this app, so a device already set to large text gets that scaling, and this
 * multiplier lets a parent go further for story text specifically without
 * changing every app on their phone.
 */
const TEXT_SIZE_SCALE: Record<AppSettings["textSize"], number> = {
  small: 0.875,
  medium: 1,
  large: 1.25,
};

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

  const { settings } = useSettings();
  const scale = TEXT_SIZE_SCALE[settings?.textSize ?? "medium"] ?? 1;

  const base = isSleep ? styles.paragraphSleep : styles.paragraphText;
  const scaledParagraph = {
    fontSize: base.fontSize * scale,
    lineHeight: base.lineHeight * scale,
  };
  const scaledDropCap = {
    fontSize: styles.dropCap.fontSize * scale,
    lineHeight: styles.dropCap.lineHeight * scale,
  };

  return (
    <View style={styles.textSection}>
      {paragraphs.map((paragraph, index) => (
        <Animated.View
          key={`${partIndex}-${index}`}
          entering={FadeInDown.duration(400).delay(index * 80)}
        >
          {index === 0 ? (
            <Text
              testID="story-paragraph"
              style={[styles.paragraphText, isSleep && styles.paragraphSleep, scaledParagraph]}
            >
              <Text style={[styles.dropCap, { color: accent }, scaledDropCap]}>
                {paragraph.charAt(0)}
              </Text>
              {paragraph.slice(1)}
            </Text>
          ) : (
            <Text
              testID="story-paragraph"
              style={[styles.paragraphText, isSleep && styles.paragraphSleep, scaledParagraph]}
            >
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
