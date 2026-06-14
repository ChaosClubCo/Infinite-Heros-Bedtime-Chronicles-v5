import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { StarField } from "@/components/StarField";
import Colors from "@/constants/colors";
import { setParentConsent, getOnboardingComplete } from "@/lib/storage";

/** Build a simple arithmetic parent gate that a young child is unlikely to pass. */
function makeChallenge() {
  const a = 5 + Math.floor(Math.random() * 8); // 5..12
  const b = 4 + Math.floor(Math.random() * 8); // 4..11
  const answer = a + b;
  // Three plausible wrong answers near the real one.
  const options = new Set<number>([answer]);
  while (options.size < 4) {
    const delta = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? -1 : 1);
    const candidate = answer + delta;
    if (candidate > 0) options.add(candidate);
  }
  return {
    a,
    b,
    answer,
    options: Array.from(options).sort(() => Math.random() - 0.5),
  };
}

export default function ParentalConsentScreen() {
  const insets = useSafeAreaInsets();
  const [challenge, setChallenge] = useState(makeChallenge);
  const [gatePassed, setGatePassed] = useState(false);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const prompt = useMemo(
    () => `What is ${challenge.a} + ${challenge.b}?`,
    [challenge],
  );

  function handleAnswer(value: number) {
    if (value === challenge.answer) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setError(false);
      setGatePassed(true);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(true);
      setChallenge(makeChallenge());
    }
  }

  async function handleConsent() {
    if (submitting) return;
    setSubmitting(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await setParentConsent();
      const onboarded = await getOnboardingComplete();
      router.replace(onboarded ? "/(tabs)" : "/welcome");
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <StarField />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badge}>
          <Ionicons name="shield-checkmark" size={32} color={Colors.accent} />
        </View>

        <Text style={styles.title}>A quick step for grown-ups</Text>
        <Text style={styles.subtitle}>
          Infinity Heroes is made for children ages 3–9. Before your child
          begins, a parent or guardian needs to give permission.
        </Text>

        {!gatePassed ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Parents only</Text>
            <Text style={styles.challengePrompt}>{prompt}</Text>
            <View style={styles.optionsRow}>
              {challenge.options.map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => handleAnswer(opt)}
                  style={({ pressed }) => [
                    styles.option,
                    pressed && styles.optionPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Answer ${opt}`}
                >
                  <Text style={styles.optionText}>{opt}</Text>
                </Pressable>
              ))}
            </View>
            {error && (
              <Text style={styles.errorText}>
                Not quite — please ask a grown-up to continue.
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>What you’re agreeing to</Text>
            <ConsentPoint
              icon="phone-portrait-outline"
              text="Your child’s profile (name, age, favorite hero) is stored only on this device."
            />
            <ConsentPoint
              icon="sparkles-outline"
              text="To create a story, the hero details and any name/age you provide are sent to our AI partners to generate that story, then not stored on our servers."
            />
            <ConsentPoint
              icon="mic-outline"
              text="Voice Chat is optional. If you use it, your child’s voice recording is sent to our AI partner to respond, and is not stored by us."
            />
            <ConsentPoint
              icon="shield-checkmark-outline"
              text="No ads, no tracking, no accounts, and every story is filtered through child-safety rules."
            />

            <Pressable
              onPress={() => router.push("/privacy")}
              style={styles.privacyLink}
              accessibilityRole="button"
            >
              <Ionicons name="document-text-outline" size={16} color={Colors.accent} />
              <Text style={styles.privacyLinkText}>Read the full Privacy Policy</Text>
            </Pressable>

            <Pressable
              onPress={handleConsent}
              disabled={submitting}
              style={({ pressed }) => [
                styles.consentBtn,
                { opacity: pressed || submitting ? 0.7 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="I am a parent or guardian and I consent"
              testID="consent-agree-btn"
            >
              <Text style={styles.consentBtnText}>
                I’m a parent or guardian — I agree
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ConsentPoint({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>["name"]; text: string }) {
  return (
    <View style={styles.point}>
      <Ionicons name={icon} size={18} color={Colors.accent} style={styles.pointIcon} />
      <Text style={styles.pointText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a1e" },
  content: { paddingHorizontal: 24, alignItems: "center" },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(99,102,241,0.15)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 24,
    color: Colors.starlight,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(232,228,240,0.7)",
    textAlign: "center",
    marginBottom: 28,
  },
  card: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 20,
  },
  cardLabel: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Colors.accent,
    marginBottom: 16,
  },
  challengePrompt: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 22,
    color: Colors.starlight,
    textAlign: "center",
    marginBottom: 20,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  option: {
    minWidth: 64,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "rgba(99,102,241,0.12)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
    alignItems: "center",
  },
  optionPressed: { backgroundColor: "rgba(99,102,241,0.25)" },
  optionText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 20,
    color: Colors.starlight,
  },
  errorText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 13,
    color: "rgba(255,140,140,0.9)",
    textAlign: "center",
    marginTop: 16,
  },
  point: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  pointIcon: { marginTop: 2, marginRight: 12 },
  pointText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(232,228,240,0.85)",
  },
  privacyLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  privacyLinkText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: Colors.accent,
  },
  consentBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  consentBtnText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#ffffff",
  },
});
