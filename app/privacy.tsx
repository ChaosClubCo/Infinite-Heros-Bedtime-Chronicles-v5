import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StarField } from "@/components/StarField";
import Colors from "@/constants/colors";

const CONTACT_EMAIL = "privacy@bedtime-chronicles.com";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StarField />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={Colors.starlight} />
        </Pressable>
        <Text style={styles.topTitle}>Privacy Policy</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>Last updated: June 2026</Text>

        <View style={styles.highlight}>
          <Text style={styles.highlightText}>
            <Text style={styles.bold}>Summary for parents:</Text> Story data stays
            on your device. To generate a story we send the hero details and any
            name/age you provide to our AI partners; we don’t store them. There
            are no ads, no tracking, and no accounts.
          </Text>
        </View>

        <Section title="1. Information We Collect">
          <Text style={styles.label}>Stored on your device (never sent to us):</Text>
          <Bullet>Child profiles (name, age, favorite hero) — stored locally</Bullet>
          <Bullet>Generated stories, illustrations, and audio — cached on device</Bullet>
          <Bullet>Badges, reading streaks, and achievements</Bullet>
          <Bullet>App settings and parent controls (PIN stored as a salted hash)</Bullet>

          <Text style={styles.label}>Sent to our server to create a story (not stored after the response):</Text>
          <Bullet>Hero name, title, and power</Bullet>
          <Bullet>Story preferences: mode, duration, tone, setting, soundscape</Bullet>
          <Bullet>Your child’s first name and age, if you choose to provide them, to personalize the story</Bullet>
          <Bullet>Voice Chat only: the audio your child records, sent to our AI partner to generate a reply</Bullet>

          <Text style={styles.label}>Automatically collected:</Text>
          <Bullet>IP address — used for rate limiting, purged after ~60 seconds</Bullet>
          <Bullet>Random request IDs for debugging, not linked to a person</Bullet>
        </Section>

        <Section title="2. How We Use Information">
          <Bullet>Generate personalized bedtime stories, illustrations, and narration</Bullet>
          <Bullet>Respond to optional Voice Chat messages</Bullet>
          <Bullet>Prevent abuse through rate limiting</Bullet>
          <Text style={styles.paragraph}>
            We do not use any information for advertising, profiling, or analytics.
          </Text>
        </Section>

        <Section title="3. Third-Party AI Services">
          <Text style={styles.paragraph}>
            To generate stories, images, and audio we use Google Gemini, OpenAI,
            Anthropic Claude, and ElevenLabs (text-to-speech). Only the story-generation
            inputs above are shared with these services, under their respective privacy
            policies.
          </Text>
        </Section>

        <Section title="4. Children’s Privacy (COPPA)">
          <Bullet>We require a parent or guardian to give consent before any story is created or data is collected</Bullet>
          <Bullet>We do not require accounts, email addresses, or passwords</Bullet>
          <Bullet>We do not use cookies, tracking pixels, advertising, or analytics SDKs</Bullet>
          <Bullet>There are no social features, public profiles, or chat with strangers</Bullet>
          <Bullet>Any child name/age sent to create a story is used only for that story and is not stored on our servers</Bullet>
          <Bullet>Every story is filtered through mandatory child-safety rules</Bullet>
        </Section>

        <Section title="5. Data Retention">
          <Bullet>Device data: kept until you delete it or uninstall the app</Bullet>
          <Bullet>Server-side: no user data retained; rate-limit entries expire in ~60s; cached narration expires within 24h</Bullet>
          <Bullet>AI provider logs: subject to each provider’s retention policy</Bullet>
        </Section>

        <Section title="6. Parental Rights">
          <Bullet>View all data — it lives on-device in the child’s profile</Bullet>
          <Bullet>Delete any profile, story, or badge from within the app</Bullet>
          <Bullet>Delete everything by clearing app storage or uninstalling</Bullet>
          <Bullet>Set PIN-protected parent controls (length limits, bedtime, theme filtering, Voice Chat)</Bullet>
          <Bullet>Withdraw consent at any time by uninstalling or contacting us</Bullet>
        </Section>

        <Section title="7. Contact Us">
          <Text style={styles.paragraph}>
            Questions about this policy or our data practices?
          </Text>
          <Pressable
            onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
            accessibilityRole="link"
          >
            <Text style={styles.link}>{CONTACT_EMAIL}</Text>
          </Pressable>
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a1e" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  topTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    color: Colors.starlight,
  },
  content: { paddingHorizontal: 24, paddingTop: 8 },
  updated: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "rgba(232,228,240,0.5)",
    marginBottom: 20,
  },
  highlight: {
    backgroundColor: "rgba(99,102,241,0.12)",
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  highlightText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(232,228,240,0.9)",
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 17,
    color: Colors.accent,
    marginBottom: 12,
  },
  label: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: Colors.starlight,
    marginTop: 8,
    marginBottom: 8,
  },
  paragraph: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(232,228,240,0.8)",
    marginTop: 4,
  },
  bulletRow: { flexDirection: "row", marginBottom: 8, paddingRight: 8 },
  bulletDot: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
    color: Colors.accent,
    marginRight: 10,
    lineHeight: 21,
  },
  bulletText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(232,228,240,0.8)",
  },
  bold: { fontFamily: "PlusJakartaSans_700Bold", color: Colors.starlight },
  link: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 15,
    color: Colors.accent,
    marginTop: 8,
  },
});
