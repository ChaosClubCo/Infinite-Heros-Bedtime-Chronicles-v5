import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedView } from "@/components/AnimatedView";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { useFocusEffect, router } from "expo-router";
import { FadeInDown, FadeIn, FadeOut } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { StarField } from "@/components/StarField";
import { HEROES } from "@/constants/heroes";

import { CachedStory } from "@/constants/types";
import { getAllStories, getFavorites, toggleFavorite } from "@/lib/storage";
import { queueInteraction } from "@/lib/sync-queue";
import { useSyncOfflineStatus } from "@/lib/SyncOfflineContext";
import { confirmDestructive } from "@/lib/confirmDestructive";
import { buildStoryReplayParams } from "@/lib/replay-params";
import { useScreenInsets } from "@/lib/useScreenInsets";
import { formatDate } from "@/lib/format-date";
import { MODE_META, resolveStoryMode } from "@/constants/story-theme";

export default function SavedScreen() {
  const { topInset } = useScreenInsets();
  const [savedStories, setSavedStories] = useState<CachedStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const { isSyncing } = useSyncOfflineStatus();
  // Guards against a focus change or unmount landing state from a stale load.
  const cancelledRef = useRef(false);

  const load = useCallback(async () => {
    cancelledRef.current = false;
    setIsLoading(true);
    setLoadFailed(false);
    try {
      const [allStories, favIds] = await Promise.all([
        getAllStories(),
        getFavorites(),
      ]);
      if (cancelledRef.current) return;
      setSavedStories(allStories.filter((s) => favIds.includes(s.id)));
    } catch (error) {
      // Previously this rejection went unhandled and isLoading stayed true,
      // leaving the screen on a spinner with no recovery path.
      console.error("Failed to load saved stories", error);
      if (!cancelledRef.current) setLoadFailed(true);
    } finally {
      if (!cancelledRef.current) setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
      return () => { cancelledRef.current = true; };
    }, [load])
  );

  const handleUnfavorite = (id: string, title: string) => {
    confirmDestructive("Remove from Saved", `Remove "${title}" from your saved stories?`, "Remove", () => {
      toggleFavorite(id)
        .then(() => {
          setSavedStories((prev) => prev.filter((s) => s.id !== id));
          void queueInteraction("unlike", id);
        })
        .catch((err) => console.error("Failed to remove favorite", err));
    });
  };

  const getHero = (heroId: string) => HEROES.find((h) => h.id === heroId);

  const renderStory = ({ item, index }: { item: CachedStory; index: number }) => {
    const hero = getHero(item.heroId);
    const modeColor = MODE_META[resolveStoryMode(item.mode)].color;
    const sceneImage = item.scenes ? Object.values(item.scenes)[0] : null;

    return (
      <AnimatedView entering={FadeInDown.duration(300).delay(index * 80)}>
        <Pressable
          style={styles.storyRow}
          onPress={() => {
            router.push({
              pathname: "/story",
              params: buildStoryReplayParams(item),
            });
          }}
          onLongPress={() => handleUnfavorite(item.id, item.story.title)}
          testID={`saved-story-${item.id}`}
          accessibilityLabel={`Open story: ${item.story.title}`}
          accessibilityRole="button"
        >
          <View style={styles.storyThumb}>
            {sceneImage ? (
              <Image source={{ uri: sceneImage }} style={styles.thumbImage} resizeMode="cover" />
            ) : (
              <LinearGradient colors={hero?.gradient || ["#1e1b4b", "#312e81"]} style={styles.thumbImage}>
                <Ionicons name={(hero?.iconName || "book") as React.ComponentProps<typeof Ionicons>["name"]} size={22} color="rgba(255,255,255,0.4)" />
              </LinearGradient>
            )}
          </View>
          <View style={styles.storyContent}>
            <Text style={styles.storyTitle} numberOfLines={1}>{item.story.title}</Text>
            <Text style={styles.storyMeta}>
              {hero?.name || "Hero"} · {item.story.parts.length} {item.story.parts.length === 1 ? "chapter" : "chapters"}
            </Text>
            <View style={styles.tagRow}>
              <View style={[styles.modeTag, { backgroundColor: `${modeColor}20`, borderColor: `${modeColor}40` }]}>
                <Text style={[styles.modeTagText, { color: modeColor }]}>{item.mode}</Text>
              </View>
              <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
            </View>
          </View>
          <Pressable
            style={styles.heartBtn}
            onPress={() => handleUnfavorite(item.id, item.story.title)}
            hitSlop={12}
            testID={`unsave-${item.id}`}
            accessibilityLabel="Remove from favorites"
            accessibilityRole="button"
          >
            <Ionicons name="heart" size={20} color="#f43f5e" />
          </Pressable>
        </Pressable>
      </AnimatedView>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0a0a1e", "#0d0d28", "#0a0a1e"]} style={StyleSheet.absoluteFill} />
      <StarField />

      <ResponsiveContainer style={{ flex: 1 }}>
        <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Ionicons name="heart" size={22} color="#f43f5e" />
        <Text style={styles.headerTitle}>Saved Stories</Text>
        {savedStories.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{savedStories.length}</Text>
          </View>
        )}
        {isSyncing && (
          <AnimatedView entering={FadeIn} exiting={FadeOut} style={styles.syncPill} testID="saved_sync_indicator">
            <ActivityIndicator size="small" color="#f43f5e" />
            <Text style={styles.syncPillText}>Syncing...</Text>
          </AnimatedView>
        )}
      </View>

      {!isLoading && loadFailed ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="cloud-offline-outline" size={52} color="rgba(244,63,94,0.25)" />
          </View>
          <Text style={styles.emptyTitle}>Could not open your saved stories</Text>
          <Text style={styles.emptySubtitle}>
            They are still saved on this device. Try again in a moment.
          </Text>
          <Pressable
            onPress={() => void load()}
            style={styles.retryBtn}
            testID="saved-retry-btn"
            accessibilityRole="button"
            accessibilityLabel="Try loading your saved stories again"
          >
            <Ionicons name="refresh" size={16} color={Colors.accent} />
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      ) : !isLoading && savedStories.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="heart-outline" size={52} color="rgba(244,63,94,0.25)" />
          </View>
          <Text style={styles.emptyTitle}>No saved stories</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart icon on any story to save it here for easy access later.
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedStories}
          renderItem={renderStory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          scrollEnabled={savedStories.length > 0}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
      </ResponsiveContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a1e" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 26,
    color: "#FFFFFF",
    letterSpacing: -0.5,
    flex: 1,
  },
  countBadge: {
    backgroundColor: "rgba(244,63,94,0.15)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(244,63,94,0.3)",
  },
  countText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 13,
    color: "#f43f5e",
  },
  syncPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "rgba(244,63,94,0.1)",
  },
  syncPillText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    color: "#f43f5e",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    marginVertical: 4,
  },
  storyRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    gap: 14,
  },
  storyThumb: {
    width: 64,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  storyContent: {
    flex: 1,
    gap: 3,
  },
  storyTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  storyMeta: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  modeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  modeTagText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
    textTransform: "capitalize",
  },
  dateText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
  },
  heartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(244,63,94,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: `${Colors.accent}40`,
    backgroundColor: `${Colors.accent}12`,
  },
  retryText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: Colors.accent,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 48,
    gap: 14,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(244,63,94,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 20,
    color: "#FFFFFF",
  },
  emptySubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    lineHeight: 20,
  },
});
