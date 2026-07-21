import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { StarField } from "@/components/StarField";
import Colors from "@/constants/colors";
import { CONSENT_DISCLOSURES, recordParentConsent } from "@/lib/consent-record";
import { useConsent } from "@/lib/ConsentContext";

/**
 * Build a simple arithmetic parent gate that a young child is unlikely to pass.
 * Free-form numeric entry (not multiple choice) so random guessing does not
 * converge in constant time; paired with a lockout in the component below.
 */
function makeChallenge() {
  const a = 5 + Math.floor(Math.random() * 8);
  const b = 4 + Math.floor(Math.random() * 8);
  return { a, b, answer: a + b };
}

/** Wrong answers allowed before a cooldown, then how long that cooldown lasts (escalating). */
const MAX_ATTEMPTS_BEFORE_LOCKOUT = 3;
const BASE_LOCKOUT_MS = 30_000;

export default function ParentalConsentScreen() {
  const insets = useSafeAreaInsets();
  const [challenge, setChallenge] = useState(makeChallenge);
  const [answerInput, setAnswerInput] = useState("");
  const [gatePassed, setGatePassed] = useState(false);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [lockoutTier, setLockoutTier] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const { markConsented } = useConsent();

  const prompt = useMemo(
    () => `What is ${challenge.a} + ${challenge.b}?`,
    [challenge],
  );

  // Tick a countdown only while a cooldown is active; stop once expired.
  useEffect(() => {
    if (lockedUntil <= 0) return;
    const id = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= lockedUntil) {
        clearInterval(id);
      }
    }, 500);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const remainingLockMs = Math.max(0, lockedUntil - now);
  const locked = remainingLockMs > 0;

  function handleSubmit() {
    if (locked) return;
    const trimmed = answerInput.trim();
    if (trimmed === "") return;
    if (Number(trimmed) === challenge.answer) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setError(false);
      setGatePassed(true);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setError(true);
    setAnswerInput("");
    setChallenge(makeChallenge());
    const attempts = wrongAttempts + 1;
    if (attempts >= MAX_ATTEMPTS_BEFORE_LOCKOUT) {
      // Escalating cooldown: 30s, 60s, 120s, … so brute-force guessing can't
      // converge — a child who can't do the arithmetic is stopped, not merely slowed.
      const tier = lockoutTier + 1;
      setLockoutTier(tier);
      setLockedUntil(Date.now() + BASE_LOCKOUT_MS * 2 ** (tier - 1));
      setWrongAttempts(0);
    } else {
      setWrongAttempts(attempts);
    }
  }

  async function handleConsent() {
    if (submitting) return;
    setSubmitting(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await recordParentConsent();
      markConsented();
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/");
      }
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
          begins, a parent or guardian needs to review the data choices and give
          permission.
        </Text>

        {!gatePassed ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Parents only</Text>
            <Text style={styles.challengePrompt}>{prompt}</Text>
            <TextInput
              style={styles.answerInput}
              value={answerInput}
              onChangeText={(t) => setAnswerInput(t.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              maxLength={3}
              editable={!locked}
              placeholder="Type the answer"
              placeholderTextColor="rgba(232,228,240,0.35)"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              accessibilityLabel="Answer to the math question"
              testID="parent-gate-input"
            />
            <Pressable
              onPress={handleSubmit}
              disabled={locked || answerInput.trim() === ""}
              style={({ pressed }) => [
                styles.gateBtn,
                { opacity: locked || answerInput.trim() === "" ? 0.5 : pressed ? 0.8 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Check answer and continue"
              testID="parent-gate-submit"
            >
              <Text style={styles.gateBtnText}>Continue</Text>
            </Pressable>
            {locked ? (
              <Text style={styles.errorText}>
                Too many tries — please wait {Math.ceil(remainingLockMs / 1000)}s and try again.
              </Text>
            ) : error ? (
              <Text style={styles.errorText}>
                Not quite — please ask a grown-up to continue.
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>What you’re agreeing to</Text>
            <ConsentPoint icon="phone-portrait-outline" text={CONSENT_DISCLOSURES[0]} />
            <ConsentPoint icon="cloud-outline" text={CONSENT_DISCLOSURES[1]} />
            <ConsentPoint icon="mic-off-outline" text={CONSENT_DISCLOSURES[2]} />
            <ConsentPoint icon="shield-checkmark-outline" text={CONSENT_DISCLOSURES[3]} />
            <ConsentPoint icon="trash-outline" text={CONSENT_DISCLOSURES[4]} />

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
  answerInput: {
    alignSelf: "center",
    minWidth: 160,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "rgba(99,102,241,0.12)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
    textAlign: "center",
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 22,
    color: Colors.starlight,
    marginBottom: 16,
  },
  gateBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  gateBtnText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#ffffff",
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
