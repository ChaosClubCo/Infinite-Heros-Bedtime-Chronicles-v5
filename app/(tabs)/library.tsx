import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
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
import { useProfile } from "@/lib/ProfileContext";
import { HEROES } from "@/constants/heroes";
import { CachedStory } from "@/constants/types";
import { getStoriesForProfile, getAllStories, deleteStory, getFavorites, toggleFavorite, getReadStories, markStoryRead } from "@/lib/storage";
import { queueInteraction } from "@/lib/sync-queue";
import { useSyncOfflineStatus } from "@/lib/SyncOfflineContext";
import { confirmDestructive } from "@/lib/confirmDestructive";
import { buildStoryReplayParams } from "@/lib/replay-params";
import { useScreenInsets } from "@/lib/useScreenInsets";
import { formatDate } from "@/lib/format-date";
import { MODE_META, resolveStoryMode } from "@/constants/story-theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

export default function LibraryScreen() {
  const { topInset } = useScreenInsets();
  const { activeProfile } = useProfile();
  const [stories, setStories] = useState<CachedStory[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [readStories, setReadStories] = useState<string[]>([]);
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
      const [s, f, r] = await Promise.all([
        activeProfile ? getStoriesForProfile(activeProfile.id) : getAllStories(),
        getFavorites(),
        getReadStories(),
      ]);
      if (cancelledRef.current) return;
      setStories(s);
      setFavorites(f);
      setReadStories(r);
    } catch (error) {
      // Without this the rejection went unhandled, isLoading stayed true, and
      // the screen sat on a spinner forever with no way back.
      console.error("Failed to load library", error);
      if (!cancelledRef.current) setLoadFailed(true);
    } finally {
      if (!cancelledRef.current) setIsLoading(false);
    }
  }, [activeProfile]);

  useFocusEffect(
    useCallback(() => {
      void load();
      return () => { cancelledRef.current = true; };
    }, [load])
  );

  const handleFavorite = async (id: string, wasFavorite: boolean) => {
    const updated = await toggleFavorite(id);
    setFavorites(updated);
    void queueInteraction(wasFavorite ? "unlike" : "like", id);
  };

  const handleDelete = (id: string, title: string) => {
    confirmDestructive("Delete Story", `Remove "${title}" from your library?`, "Delete", () => {
      deleteStory(id)
        .then(() => setStories((prev) => prev.filter((s) => s.id !== id)))
        .catch((err) => console.error("Failed to delete story", err));
    });
  };

  const getHero = (heroId: string) => HEROES.find((h) => h.id === heroId);

  const renderStory = ({ item, index }: { item: CachedStory; index: number }) => {
    const hero = getHero(item.heroId);
    const isFav = favorites.includes(item.id);
    const isUnread = !readStories.includes(item.id);
    const modeColor = MODE_META[resolveStoryMode(item.mode)].color;
    const sceneImage = item.scenes ? Object.values(item.scenes)[0] : null;

    return (
      <AnimatedView entering={FadeInDown.duration(300).delay(index * 60)}>
        <Pressable
          style={styles.storyCard}
          onPress={() => {
            if (isUnread) {
              void markStoryRead(item.id).catch((error) => {
                // Non-fatal: log storage failure instead of causing an unhandled rejection
                console.error("Failed to mark story as read:", error);
              });
              setReadStories((prev) => {
                if (prev.includes(item.id)) {
                  return prev;
                }
                return [...prev, item.id];
              });
            }
            router.push({
              pathname: "/story",
              params: buildStoryReplayParams(item),
            });
          }}
          onLongPress={() => handleDelete(item.id, item.story.title)}
          testID={`library-story-${item.id}`}
          accessibilityLabel={`Open story: ${item.story.title}`}
          accessibilityRole="button"
        >
          <View style={styles.storyImageWrap}>
            {sceneImage ? (
              <Image source={{ uri: sceneImage }} style={styles.storyImage} resizeMode="cover" />
            ) : (
              <LinearGradient colors={hero?.gradient || ["#1e1b4b", "#312e81"]} style={styles.storyImage}>
                <Ionicons name={(hero?.iconName || "book") as React.ComponentProps<typeof Ionicons>["name"]} size={36} color="rgba(255,255,255,0.3)" />
              </LinearGradient>
            )}
            <LinearGradient
              colors={["transparent", "transparent", "rgba(0,0,0,0.8)"]}
              locations={[0, 0.35, 1]}
              style={styles.storyOverlay}
            />
            <View style={styles.topLeftBadges}>
              <View style={[styles.modeBadge, { backgroundColor: `${modeColor}cc` }]}>
                <Text style={styles.modeBadgeText}>{item.mode.toUpperCase()}</Text>
              </View>
              {isUnread && <View style={styles.unreadDot} />}
            </View>
            {isUnread && (
              <View style={styles.unreadBadge} testID={`unread-${item.id}`}>
                <Text style={styles.unreadBadgeText}>NEW</Text>
              </View>
            )}
            <Pressable
              style={styles.favBtn}
              onPress={() => handleFavorite(item.id, isFav)}
              hitSlop={12}
              testID={`fav-${item.id}`}
              accessibilityLabel={isFav ? "Remove from favorites" : "Add to favorites"}
              accessibilityRole="button"
            >
              <Ionicons name={isFav ? "heart" : "heart-outline"} size={18} color={isFav ? "#f43f5e" : "rgba(255,255,255,0.6)"} />
            </Pressable>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.story.title}</Text>
              <Text style={styles.cardMeta}>
                {hero?.name || "Hero"} · {formatDate(item.timestamp)}
              </Text>
            </View>
          </View>
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
        <Text style={styles.headerTitle}>Your Library</Text>
        <Text style={styles.headerCount}>
          {stories.length} {stories.length === 1 ? "story" : "stories"}
        </Text>
        {isSyncing && (
          <AnimatedView entering={FadeIn} exiting={FadeOut} style={styles.syncPill} testID="library_sync_indicator">
            <ActivityIndicator size="small" color={Colors.accent} />
            <Text style={styles.syncPillText}>Syncing Chronicles...</Text>
          </AnimatedView>
        )}
      </View>

      {!isLoading && loadFailed ? (
        <View style={styles.emptyState}>
          <Ionicons name="cloud-offline-outline" size={56} color="rgba(99,102,241,0.2)" />
          <Text style={styles.emptyTitle}>Could not open your library</Text>
          <Text style={styles.emptySubtitle}>
            Your stories are still saved on this device.{"\n"}Try again in a moment.
          </Text>
          <Pressable
            onPress={() => void load()}
            style={styles.retryBtn}
            testID="library-retry-btn"
            accessibilityRole="button"
            accessibilityLabel="Try loading your library again"
          >
            <Ionicons name="refresh" size={16} color={Colors.accent} />
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      ) : !isLoading && stories.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={56} color="rgba(99,102,241,0.2)" />
          <Text style={styles.emptyTitle}>No stories yet</Text>
          <Text style={styles.emptySubtitle}>
            Stories you create will appear here.{"\n"}Go to Create to start your first adventure!
          </Text>
        </View>
      ) : (
        <FlatList
          data={stories}
          renderItem={renderStory}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          scrollEnabled={stories.length > 0}
        />
      )}
      </ResponsiveContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a1e" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 26,
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerCount: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    marginTop: 2,
  },
  syncPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "rgba(99,102,241,0.12)",
  },
  syncPillText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    color: Colors.accent,
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  gridRow: {
    gap: 14,
  },
  storyCard: {
    width: CARD_WIDTH,
    marginBottom: 14,
  },
  storyImageWrap: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(99,102,241,0.12)",
  },
  storyImage: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  storyOverlay: {
    ...StyleSheet.absoluteFill,
  },
  topLeftBadges: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  modeBadgeText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 8,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  favBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    gap: 2,
  },
  cardTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
    color: "#FFFFFF",
    lineHeight: 18,
  },
  cardMeta: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
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
    gap: 12,
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
  unreadBadge: {
    position: "absolute",
    top: 34,
    left: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.success,
  },
  unreadBadgeText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 8,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
});
