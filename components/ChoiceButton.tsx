import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp } from "react-native-reanimated";

interface ChoiceButtonProps {
  label: string;
  index: number;
  onPress: () => void;
  colors: [string, string][];
}

export function ChoiceButton({ label, index, onPress, colors }: ChoiceButtonProps) {
  const pair = colors[index % colors.length];

  return (
    <Animated.View entering={FadeInUp.duration(400).delay(index * 120)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.choiceButton,
          { transform: [{ scale: pressed ? 0.96 : 1 }] },
        ]}
        testID={`choice-${index}`}
        accessibilityRole="button"
        accessibilityLabel={`Choice ${String.fromCharCode(65 + index)}: ${label}`}
      >
        <LinearGradient
          colors={pair}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.choiceGradient}
        >
          <View style={styles.choiceIndex}>
            <Text style={styles.choiceIndexText}>{String.fromCharCode(65 + index)}</Text>
          </View>
          <Text style={styles.choiceText}>{label}</Text>
          <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.6)" />
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  choiceButton: { borderRadius: 16, overflow: "hidden" },
  choiceGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  choiceIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  choiceIndexText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 13,
    color: "#FFF",
  },
  choiceText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
    color: "#FFF",
    flex: 1,
  },
});
