import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ChoiceButton } from "@/components/ChoiceButton";

interface StoryChoicesProps {
  heroName: string;
  choices: string[];
  accent: string;
  choiceColors: [string, string][];
  partIndex: number;
  onSelect: (choiceIndex: number) => void;
}

export function StoryChoices({ heroName, choices, accent, choiceColors, partIndex, onSelect }: StoryChoicesProps) {
  return (
    <View style={styles.choicesSection}>
      <Text style={[styles.choicesLabel, { color: accent }]}>
        What should {heroName} do next?
      </Text>
      {choices.map((choice, i) => (
        <ChoiceButton
          key={`${partIndex}-choice-${i}`}
          label={choice}
          index={i}
          onPress={() => onSelect(i)}
          colors={choiceColors}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  choicesSection: { marginTop: 12, gap: 12, paddingHorizontal: 24 },
  choicesLabel: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 4,
  },
});
