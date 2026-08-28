import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Image, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Video, ResizeMode } from "expo-av";
import Animated, { FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { getApiUrl } from "@/lib/query-client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { VIDEO_POLL_INTERVAL_MS } from "@/constants/timing";

interface StoryTheme {
  accent: string;
  gradient: [string, string, string];
}

function SceneVideoPlayer({ jobId, accent }: { jobId: string; accent: string }) {
  const [status, setStatus] = useState<"queued" | "in_progress" | "completed" | "failed">("queued");
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    const baseUrl = getApiUrl();

    pollRef.current = setInterval(async () => {
      try {
        const res = await globalThis.fetch(
          new URL(`/api/video-status/${jobId}`, baseUrl).toString()
        );
        if (!res.ok) return;
        const data = await res.json();
        setStatus(data.status);
        setProgress(data.progress || 0);

        if (data.status === "completed" && data.videoUrl) {
          setVideoUrl(new URL(data.videoUrl, baseUrl).toString());
          if (pollRef.current) clearInterval(pollRef.current);
        }
        if (data.status === "failed") {
          setError(data.error || "Video generation failed");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch (e) {
        console.error("Video polling error:", e);
        setError("Failed to check video status");
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, VIDEO_POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [jobId]);

  if (error || status === "failed") {
    return null;
  }

  if (!videoUrl) {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={s.videoLoadingWrap}>
        <View style={s.videoLoadingRow}>
          <ActivityIndicator size="small" color={accent} />
          <Text style={s.videoLoadingText}>
            {status === "queued" ? "Preparing video..." : `Creating scene video... ${progress}%`}
          </Text>
        </View>
        <View style={s.videoProgressBg}>
          <View style={[s.videoProgressFill, { width: `${Math.max(progress, 5)}%`, backgroundColor: accent }]} />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(600)} style={s.videoPlayerWrap}>
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        style={s.videoPlayer}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted={false}
        volume={0.5}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.3)"]}
        style={s.sceneImageOverlay}
      />
      <View style={s.videoTag}>
        <Ionicons name="videocam" size={10} color="rgba(255,255,255,0.7)" />
        <Text style={s.videoTagText}>AI Scene</Text>
      </View>
    </Animated.View>
  );
}

interface StorySceneDisplayProps {
  sceneImage: string | null;
  sceneLoading: boolean;
  sceneError: boolean;
  theme: StoryTheme;
  videoEnabled: boolean;
  videoJobId: string | null;
  /** Called when the user taps to generate or retry the scene image. */
  onLoadScene: () => void;
}

export function StorySceneDisplay({
  sceneImage,
  sceneLoading,
  sceneError,
  theme,
  videoEnabled,
  videoJobId,
  onLoadScene,
}: StorySceneDisplayProps) {
  return (
    <>
      <View style={s.sceneHeroWrap}>
        {sceneImage && !sceneLoading ? (
          <Animated.View entering={FadeIn.duration(600)} style={StyleSheet.absoluteFill}>
            <Image source={{ uri: sceneImage }} style={s.sceneHeroImage} resizeMode="cover" />
          </Animated.View>
        ) : sceneLoading ? (
          <View style={s.sceneHeroPlaceholder}>
            <ActivityIndicator size="small" color={theme.accent} />
            <Text style={s.sceneLoadingText}>Painting the scene...</Text>
          </View>
        ) : sceneError ? (
          <View style={s.sceneHeroPlaceholder}>
            <Ionicons name="image-outline" size={32} color="rgba(255,255,255,0.15)" />
            <Pressable
              onPress={onLoadScene}
              style={[s.sceneRetryBtn, { borderColor: `${theme.accent}40` }]}
            >
              <Ionicons name="refresh" size={14} color={theme.accent} />
              <Text style={[s.sceneRetryText, { color: theme.accent }]}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={s.sceneHeroPlaceholder} onPress={onLoadScene}>
            <Ionicons name="image-outline" size={28} color={`${theme.accent}30`} />
            <Text style={[s.sceneGenerateText, { color: `${theme.accent}70` }]}>
              Tap to illustrate
            </Text>
          </Pressable>
        )}
        <LinearGradient
          colors={["rgba(5,5,30,0.2)", "rgba(5,5,30,0.6)", theme.gradient[0]]}
          locations={[0, 0.6, 1]}
          style={s.sceneHeroOverlay}
        />
      </View>

      {videoEnabled && videoJobId && (
        <ErrorBoundary
          FallbackComponent={({ resetError }) => (
            <View style={s.sceneErrorWrap}>
              <Ionicons name="videocam-off-outline" size={28} color="rgba(255,255,255,0.2)" />
              <Text style={s.sceneErrorText}>Video unavailable</Text>
              <Pressable
                onPress={resetError}
                style={[s.sceneRetryBtn, { borderColor: `${theme.accent}40` }]}
              >
                <Ionicons name="refresh" size={14} color={theme.accent} />
                <Text style={[s.sceneRetryText, { color: theme.accent }]}>Retry</Text>
              </Pressable>
            </View>
          )}
        >
          <SceneVideoPlayer jobId={videoJobId} accent={theme.accent} />
        </ErrorBoundary>
      )}
    </>
  );
}

const s = StyleSheet.create({
  sceneHeroWrap: {
    width: "100%",
    height: 280,
    backgroundColor: "rgba(5,5,30,0.8)",
    position: "relative",
    overflow: "hidden",
  },
  sceneHeroImage: {
    width: "100%",
    height: "100%",
  },
  sceneHeroPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  sceneHeroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70%",
  },
  sceneLoadingText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  sceneRetryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 4,
  },
  sceneRetryText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
  },
  sceneGenerateText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    marginTop: 4,
  },
  sceneErrorWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    paddingVertical: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sceneErrorText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.3)",
  },
  videoLoadingWrap: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 10,
  },
  videoLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  videoLoadingText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  videoProgressBg: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  videoProgressFill: {
    height: 3,
    borderRadius: 2,
  },
  videoPlayerWrap: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    position: "relative",
  },
  videoPlayer: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    backgroundColor: "#000",
  },
  sceneImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  videoTag: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  videoTagText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 9,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.3,
  },
});
