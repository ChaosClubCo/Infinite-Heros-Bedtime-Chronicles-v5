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
        <Text style={styles.updated}>Last updated: July 2026</Text>

        <View style={styles.highlight}>
          <Text style={styles.highlightText}>
            <Text style={styles.bold}>Summary for parents:</Text> Child profile name
            and age stay on the device and are discarded by the server before AI
            requests are built. A parent may create an optional account for cloud
            backup and Voice Chat. Fictional story inputs and Voice Chat audio are
            sent to service providers to produce the requested feature. We retain
            only the server data described below, and Delete All Data removes the
            account, cloud records, Voice Chat history, and local device data.
          </Text>
        </View>

        <Section title="1. Information We Collect">
          <Text style={styles.label}>Stored on your device:</Text>
          <Bullet>Child profiles, including name, age range, favorite hero, and avatar choices</Bullet>
          <Bullet>Generated stories, illustrations, narration cache, badges, streaks, and achievements</Bullet>
          <Bullet>App settings and parent controls, including the locally protected parent PIN</Bullet>

          <Text style={styles.label}>Optional parent account and cloud backup:</Text>
          <Bullet>A parent email address, account identifier, and authentication records are handled by Supabase</Bullet>
          <Bullet>When cloud backup is enabled, stories and progress records are stored under the parent account</Bullet>
          <Bullet>Cloud backup uses a profile stub and does not upload the child profile name or age</Bullet>

          <Text style={styles.label}>Sent to our services and AI providers:</Text>
          <Bullet>Fictional hero details and parent-selected story preferences needed to create a story</Bullet>
          <Bullet>Explicit child profile name and age fields are discarded by the server and are not included in story or suggestion provider prompts</Bullet>
          <Bullet>Voice Chat audio, when enabled and used, for speech transcription</Bullet>
          <Bullet>Approved text for narration or other requested media generation</Bullet>

          <Text style={styles.label}>Retained on our servers:</Text>
          <Bullet>Voice Chat conversation titles and sanitized text transcripts tied to the signed-in parent account</Bullet>
          <Bullet>Cloud-backup records when the parent turns that feature on</Bullet>
          <Bullet>Security, rate-limit, request, and error information needed to operate and protect the service</Bullet>
          <Text style={styles.paragraph}>
            We do not intentionally retain the raw Voice Chat recording after it has
            been submitted for transcription. AI providers may process or retain
            request data according to the provider terms and agreements applicable to
            the production service.
          </Text>
        </Section>

        <Section title="2. How We Use Information">
          <Bullet>Generate bedtime stories, illustrations, narration, and optional Voice Chat replies</Bullet>
          <Bullet>Save and synchronize stories and progress when a parent enables cloud backup</Bullet>
          <Bullet>Authenticate the parent account and enforce owner-only access</Bullet>
          <Bullet>Prevent abuse, investigate errors, and protect service reliability</Bullet>
          <Text style={styles.paragraph}>
            We do not use child information for targeted advertising, sale of personal
            information, or behavioral profiling.
          </Text>
        </Section>

        <Section title="3. Service Providers">
          <Text style={styles.paragraph}>
            Depending on the feature and current production configuration, service
            providers may include Supabase for authentication and cloud storage;
            OpenAI, Google Gemini, Anthropic Claude, or other approved AI providers for
            text, image, transcription, and audio generation; ElevenLabs for narration;
            and infrastructure or error-monitoring providers. A provider is enabled for
            child Voice Chat in production only after the required data-processing,
            privacy-notice, retention, and app-store attestations are recorded in the
            deployment configuration.
          </Text>
        </Section>

        <Section title="4. Children’s Privacy and Parental Consent">
          <Bullet>A parent or guardian must pass the grown-up gate and consent before protected app features are available</Bullet>
          <Bullet>Accounts and cloud backup are optional parent-controlled features</Bullet>
          <Bullet>There are no public child profiles, stranger messaging, advertising networks, or social feeds</Bullet>
          <Bullet>Child-facing AI responses are generated under a child-safety policy and checked before they are displayed or narrated</Bullet>
          <Bullet>Voice Chat is disabled by default and must be explicitly enabled in an approved production configuration</Bullet>
        </Section>

        <Section title="5. Data Retention">
          <Bullet>Device data remains until the parent deletes it, resets the app, or uninstalls the app</Bullet>
          <Bullet>Cloud-backup records remain until deleted by the parent or the parent account is deleted</Bullet>
          <Bullet>Voice Chat transcripts use the approved production retention period and are automatically purged no later than 30 days after creation; they can be deleted sooner from the app</Bullet>
          <Bullet>Parent authentication records remain until the parent account is deleted</Bullet>
          <Bullet>Operational logs and provider records follow the documented production retention settings and applicable provider agreements</Bullet>
        </Section>

        <Section title="6. Parental Rights and Controls">
          <Bullet>Review and delete individual Voice Chat conversations from the app</Bullet>
          <Bullet>Turn cloud backup and Voice Chat off</Bullet>
          <Bullet>Delete individual profiles, stories, and progress records</Bullet>
          <Bullet>Use Delete All Data to remove PostgreSQL Voice Chat history, the Supabase account and cloud records, and all local device data</Bullet>
          <Bullet>Withdraw consent and restart the parental-consent flow</Bullet>
          <Bullet>Contact us to ask a privacy question or report a deletion problem</Bullet>
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
