import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

/**
 * First-release containment screen.
 *
 * This route intentionally imports no microphone, recording, playback, chat,
 * TTS, or network modules. Direct links therefore fail closed without asking
 * for permissions or transmitting audio while Voice Chat is unapproved.
 */
export default function VoiceChatDisabledScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="mic-off-outline" size={36} color={Colors.accent} />
        </View>
        <Text style={styles.title}>Voice Chat is unavailable</Text>
        <Text style={styles.body}>
          Microphone access, audio recording, and audio transmission are disabled
          for this release while privacy, safety, provider, and device approvals
          are completed.
        </Text>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Return to the app"
          testID="voice-chat-disabled-back"
        >
          <Text style={styles.buttonText}>Go back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a1e",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 24,
    alignItems: "center",
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "rgba(99,102,241,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    color: Colors.starlight,
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 24,
    textAlign: "center",
    marginBottom: 12,
  },
  body: {
    color: "rgba(232,228,240,0.78)",
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: Colors.accent,
    paddingVertical: 15,
    alignItems: "center",
  },
  buttonPressed: { opacity: 0.75 },
  buttonText: {
    color: "#ffffff",
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
  },
});
