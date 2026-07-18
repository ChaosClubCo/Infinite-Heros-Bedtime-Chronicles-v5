import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

/**
 * Voice Chat is intentionally unavailable for the current release train.
 *
 * This screen contains no audio imports, microphone permission request,
 * recording code, transcript access, or conversation network calls. Keeping a
 * static route prevents stale deep links from reaching an active audio client
 * while still explaining the release-safe state to a parent.
 */
export default function VoiceChatUnavailableScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.starlight} />
        </Pressable>
        <Text style={styles.headerTitle}>Voice Chat</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="mic-off-outline" size={48} color={Colors.accent} />
        </View>
        <Text style={styles.title}>Voice Chat is unavailable</Text>
        <Text style={styles.description}>
          Microphone access and voice-message processing are disabled for this release.
          They will remain unavailable until privacy, safety, provider, and device-review
          requirements are separately approved.
        </Text>
        <Text style={styles.detail}>
          No microphone permission is requested and no audio is sent from this screen.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          accessibilityLabel="Return to profile"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Return to Profile</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Nunito_700Bold",
    fontSize: 18,
    color: Colors.starlight,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.14)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.35)",
    marginBottom: 24,
  },
  title: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 24,
    color: Colors.starlight,
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 15,
    lineHeight: 23,
    color: "rgba(232,228,240,0.75)",
    textAlign: "center",
    maxWidth: 520,
  },
  detail: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(232,228,240,0.55)",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 28,
  },
  button: {
    minWidth: 220,
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.accent,
  },
  buttonPressed: {
    opacity: 0.78,
  },
  buttonText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
    color: "#ffffff",
  },
});
