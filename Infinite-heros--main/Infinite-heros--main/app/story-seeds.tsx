import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { StarField } from "@/components/StarField";
import { STORY_SEEDS, ContentTheme } from "@/constants/story-seeds";
import { SeedCard } from "@/components/SeedCard";

const THEMES: { id: ContentTheme | "all"; label: string; emoji: string }[] = [
  { id: "all", label: "All Themes", emoji: "✨" },
  { id: "courage", label: "Courage", emoji: "🦁" },
  { id: "kindness", label: "Kindness", emoji: "💗" },
  { id: "friendship", label: "Friendship", emoji: "🤝" },
  { id: "wonder", label: "Wonder", emoji: "✨" },
  { id: "imagination", label: "Imagination", emoji: "🌈" },
  { id: "comfort", label: "Comfort", emoji: "🧸" },
];

const AGES: ("all" | "2-4" | "4-6" | "6-8" | "8-10")[] = ["all", "2-4", "4-6", "6-8", "8-10"];

export default function StorySeedsScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 20 : insets.top;
  const bottomInset = Platform.OS === "web" ? 20 : insets.bottom;

  const [selectedTheme, setSelectedTheme] = useState<ContentTheme | "all">("all");
  const [selectedAge, setSelectedAge] = useState<"all" | "2-4" | "4-6" | "6-8" | "8-10">("all");

  const filteredSeeds = useMemo(() => {
    return STORY_SEEDS.filter((seed) => {
      const themeMatch = selectedTheme === "all" || seed.theme === selectedTheme;
      const ageMatch = selectedAge === "all" || seed.ageRange === selectedAge;
      return themeMatch && ageMatch;
    });
  }, [selectedTheme, selectedAge]);

  const handleThemePress = (themeId: ContentTheme | "all") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTheme(themeId);
  };

  const handleAgePress = (age: "all" | "2-4" | "4-6" | "6-8" | "8-10") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAge(age);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0a0a1e", "#0d0d28", "#0a0a1e"]}
        style={StyleSheet.absoluteFill}
      />
      <StarField />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backBtn}
          testID="back-button"
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Magic Story Seeds</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Filter Options */}
      <View style={styles.filtersContainer}>
        {/* Age Range Filter */}
        <Text style={styles.filterTitle}>Select Age</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={AGES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.horizontalScroll}
          renderItem={({ item }) => {
            const isActive = selectedAge === item;
            return (
              <Pressable
                onPress={() => handleAgePress(item)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                testID={`age-chip-${item}`}
                accessibilityRole="button"
                accessibilityLabel={`Age ${item}`}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {item === "all" ? "All Ages" : `Ages ${item}`}
                </Text>
              </Pressable>
            );
          }}
        />

        {/* Theme Filter */}
        <Text style={styles.filterTitle}>Select Theme</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={THEMES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.horizontalScroll}
          renderItem={({ item }) => {
            const isActive = selectedTheme === item.id;
            return (
              <Pressable
                onPress={() => handleThemePress(item.id)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                testID={`theme-chip-${item.id}`}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <Text style={styles.chipEmoji}>{item.emoji}</Text>
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Grid of Seeds */}
      <FlatList
        data={filteredSeeds}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[styles.gridContainer, { paddingBottom: bottomInset + 30 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💤</Text>
            <Text style={styles.emptyTitle}>No Story Seeds Found</Text>
            <Text style={styles.emptyText}>
              Try changing your filters to discover different stories.
            </Text>
          </View>
        }
        renderItem={({ item }) => <SeedCard seed={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a1e",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerPlaceholder: {
    width: 40,
  },
  filtersContainer: {
    paddingVertical: 12,
    gap: 8,
  },
  filterTitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.4)",
    marginLeft: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  horizontalScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 10,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  filterChipActive: {
    backgroundColor: `${Colors.accent}20`,
    borderColor: Colors.accent,
  },
  chipEmoji: {
    fontSize: 13,
  },
  filterChipText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  gridContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  gridRow: {
    justifyContent: "space-between",
    gap: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    lineHeight: 18,
  },
});
