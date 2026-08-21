import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { StarField } from "@/components/StarField";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import Colors from "@/constants/colors";
import { useSettings, AppSettings } from "@/lib/SettingsContext";
import { MODE_VOICES } from "@/constants/story-theme";
import { useAuth } from "@/lib/AuthContext";
import { useConsent } from "@/lib/ConsentContext";
import { clearAllData } from "@/lib/storage";
import { confirmDestructive, notifyResult } from "@/lib/confirmDestructive";
import { purgeCloudData, runSync } from "@/lib/sync/runSync";
import { useScreenInsets } from "@/lib/useScreenInsets";

// Voices come from MODE_VOICES so this list can never drift from the ids the
// TTS layer can actually resolve. The previous hardcoded list contained three
// invented ids ("stargazer", "dreamweaver", "whisperwind") that no narrator
// backs; selecting one persisted a value the player could not use.
const VOICES = Object.values(MODE_VOICES).flat();

const SPEED_OPTIONS = [
  { id: 0.5, label: "0.5×" },
  { id: 0.75, label: "0.75×" },
  { id: 1.0, label: "1×" },
  { id: 1.25, label: "1.25×" },
  { id: 1.5, label: "1.5×" },
  { id: 2.0, label: "2×" },
];

const TEXT_SIZES: AppSettings["textSize"][] = ["small", "medium", "large"];
const SORT_ORDERS: { id: AppSettings["librarySortOrder"]; label: string }[] = [
  { id: "recent", label: "Most Recent" },
  { id: "alphabetical", label: "A–Z" },
  { id: "theme", label: "By Theme" },
];
const AGE_RANGES: AppSettings["ageRange"][] = ["2-4", "4-6", "6-8", "8-10"];
// All five values the AppSettings type allows. The previous list omitted
// "medium-short" and "epic", so those were unreachable from the UI and an
// install already set to one showed no selected chip at all.
const STORY_LENGTHS: { id: AppSettings["storyLength"]; label: string; desc: string }[] = [
  { id: "short", label: "Short", desc: "~300 words" },
  { id: "medium-short", label: "Medium Short", desc: "~400 words" },
  { id: "medium", label: "Medium", desc: "~600 words" },
  { id: "long", label: "Long", desc: "~850 words" },
  { id: "epic", label: "Epic", desc: "~1150 words" },
];

const SLEEP_THEMES = ["Cloud Kingdom", "Starlit Ocean", "Moonlit Forest", "Crystal Cave"];
const THEMES = [
  { id: "fantasy", label: "Fantasy" },
  { id: "space", label: "Space" },
  { id: "ocean", label: "Ocean" },
  { id: "forest", label: "Forest" },
  { id: "retro", label: "Retro" },
  { id: "fairy-tale", label: "Fairy Tale" },
];

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconWrap}>
        <Ionicons name={icon as React.ComponentProps<typeof Ionicons>["name"]} size={16} color={Colors.accent} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function SettingRow({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <View style={[styles.settingRow, last && styles.settingRowLast]}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingControl}>{children}</View>
    </View>
  );
}

function ChipSelector<T extends string | number>({
  options,
  selected,
  onSelect,
  getLabel,
  groupLabel,
}: {
  options: T[];
  selected: T;
  onSelect: (v: T) => void;
  getLabel?: (v: T) => string;
  /** Names the setting this group controls, so each chip announces in context. */
  groupLabel: string;
}) {
  return (
    <View style={styles.chipRow} accessibilityRole="radiogroup" accessibilityLabel={groupLabel}>
      {options.map((opt) => {
        const isSelected = selected === opt;
        const optionLabel = getLabel ? getLabel(opt) : String(opt);
        return (
          <Pressable
            key={String(opt)}
            style={[styles.chip, isSelected && styles.chipActive]}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(opt);
            }}
            accessibilityRole="radio"
            accessibilityLabel={`${groupLabel}: ${optionLabel}`}
            accessibilityState={{ selected: isSelected }}
            // The chip is deliberately compact; hitSlop lifts the effective
            // target to the 44pt minimum without changing the visual density.
            hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
              {optionLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function VolumeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const levels = [20, 40, 60, 80, 100];
  return (
    <View style={styles.volumeRow}>
      <Ionicons
        name="volume-low-outline"
        size={14}
        color="rgba(255,255,255,0.35)"
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <View style={styles.volumeTrack}>
        {levels.map((level) => (
          <Pressable
            key={level}
            style={[
              styles.volumeSegment,
              value >= level && { backgroundColor: Colors.accent },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(level);
            }}
            accessibilityRole="adjustable"
            accessibilityLabel={`Set volume to ${level} percent`}
            accessibilityState={{ selected: value >= level }}
            hitSlop={{ top: 12, bottom: 12, left: 2, right: 2 }}
          />
        ))}
      </View>
      <Ionicons
        name="volume-high-outline"
        size={14}
        color="rgba(255,255,255,0.35)"
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <Text style={styles.volumeValue}>{value}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const { topInset, bottomInset } = useScreenInsets();
  const { settings, updateSetting, resetSettings } = useSettings();
  const { signOut, user } = useAuth();
  const { markUnconsented } = useConsent();

  const handleReset = () => {
    confirmDestructive(
      "Reset Settings",
      "Are you sure you want to reset all settings to their defaults?",
      "Reset",
      () => {
        resetSettings();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    );
  };

  const handleDeleteAllData = () => {
    confirmDestructive(
      "Delete All Data",
      "This permanently removes the parent account, cloud backup, Voice Chat history, and every profile, story, badge, streak, consent record, and setting on this device. This cannot be undone.",
      "Delete Everything",
      async () => {
        let serverReceiptId: string | null = null;
        try {
          // Server deletion must finish first while the parent session is
          // still valid. A failure leaves device data and the retry path in
          // place instead of presenting a partial deletion as complete.
          const serverReceipt = await purgeCloudData();
          serverReceiptId = serverReceipt?.receiptId ?? null;

          await clearAllData();
          await signOut();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

          const receiptMessage = serverReceiptId
            ? `Server and device deletion completed. Verification receipt: ${serverReceiptId}. Save a screenshot of this receipt for your records.`
            : "Local device deletion completed. No signed-in server account existed, so no server receipt was required.";

          notifyResult("Deletion Complete", receiptMessage, () => {
            router.replace("/parental-consent");
            markUnconsented();
          });
        } catch {
          notifyResult(
            "Deletion Not Completed",
            serverReceiptId
              ? `Server deletion completed with receipt ${serverReceiptId}, but device cleanup could not be confirmed. Keep this receipt and retry local cleanup.`
              : "The server could not confirm complete deletion. Your local app data and signed-in retry path were preserved. Please try again.",
          );
        }
      }
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0a0a1e", "#0d0d28", "#0a0a1e"]}
        style={StyleSheet.absoluteFill}
      />
      <StarField />

      <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
          hitSlop={12}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          testID="settings-back-btn"
        >
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.8)" />
        </Pressable>
        <Text style={styles.screenTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 40 + bottomInset }]}
      >
        <ResponsiveContainer>
          <View style={styles.card}>
          <SectionHeader title="Audio" icon="headset-outline" />

          <SettingRow label="Volume">
            <VolumeSlider
              value={settings.audioVolume}
              onChange={(v) => updateSetting("audioVolume", v)}
            />
          </SettingRow>

          <SettingRow label="Speed">
            <ChipSelector
              groupLabel="Speed"
              options={SPEED_OPTIONS.map((s) => s.id)}
              selected={settings.audioSpeed}
              onSelect={(v) => updateSetting("audioSpeed", v as AppSettings["audioSpeed"])}
              getLabel={(v) => SPEED_OPTIONS.find((s) => s.id === v)?.label || String(v)}
            />
          </SettingRow>

          <SettingRow label="Narrator Voice">
            <ChipSelector
              groupLabel="Narrator Voice"
              options={VOICES.map((v) => v.id)}
              selected={settings.narratorVoice}
              onSelect={(v) => updateSetting("narratorVoice", v)}
              getLabel={(v) => VOICES.find((voice) => voice.id === v)?.label || v}
            />
          </SettingRow>

          <SettingRow label="Auto-play on open">
            <Switch
              value={settings.autoPlay}
              onValueChange={(v) => updateSetting("autoPlay", v)}
              trackColor={{ false: "rgba(255,255,255,0.1)", true: `${Colors.accent}80` }}
              thumbColor={settings.autoPlay ? Colors.accent : "rgba(255,255,255,0.5)"}
              accessibilityLabel="Auto-play on open"
              accessibilityRole="switch"
            />
          </SettingRow>

          <SettingRow label="Mute all audio" last>
            <Switch
              value={settings.isMuted}
              onValueChange={(v) => updateSetting("isMuted", v)}
              trackColor={{ false: "rgba(255,255,255,0.1)", true: `${Colors.accent}80` }}
              thumbColor={settings.isMuted ? Colors.accent : "rgba(255,255,255,0.5)"}
              accessibilityLabel="Mute all audio"
              accessibilityRole="switch"
            />
          </SettingRow>
        </View>

        <View style={styles.card}>
          <SectionHeader title="Story" icon="book-outline" />

          <SettingRow label="Story Length">
            <ChipSelector
              groupLabel="Story Length"
              options={STORY_LENGTHS.map((l) => l.id)}
              selected={settings.storyLength}
              onSelect={(v) => updateSetting("storyLength", v as AppSettings["storyLength"])}
              getLabel={(v) => STORY_LENGTHS.find((l) => l.id === v)?.label || v}
            />
          </SettingRow>

          <SettingRow label="Age Range">
            <ChipSelector
              groupLabel="Age Range"
              options={AGE_RANGES}
              selected={settings.ageRange}
              onSelect={(v) => updateSetting("ageRange", v as AppSettings["ageRange"])}
            />
          </SettingRow>

          <SettingRow label="Default Theme">
            <ChipSelector
              groupLabel="Default Theme"
              options={THEMES.map((t) => t.id)}
              selected={settings.defaultTheme}
              onSelect={(v) => updateSetting("defaultTheme", v)}
              getLabel={(v) => THEMES.find((t) => t.id === v)?.label || v}
            />
          </SettingRow>

          <SettingRow label="Sleep Theme">
            <ChipSelector
              groupLabel="Sleep Theme"
              options={SLEEP_THEMES}
              selected={settings.sleepTheme}
              onSelect={(v) => updateSetting("sleepTheme", v)}
            />
          </SettingRow>

          <SettingRow label="Auto-generate images" last>
            <Switch
              value={settings.autoGenerateImages}
              onValueChange={(v) => updateSetting("autoGenerateImages", v)}
              trackColor={{ false: "rgba(255,255,255,0.1)", true: `${Colors.accent}80` }}
              thumbColor={settings.autoGenerateImages ? Colors.accent : "rgba(255,255,255,0.5)"}
              accessibilityLabel="Auto-generate images"
              accessibilityRole="switch"
            />
          </SettingRow>
        </View>

        <View style={styles.card}>
          <SectionHeader title="Playback & Reading" icon="play-circle-outline" />

          <SettingRow label="Extend Mode">
            <Switch
              value={settings.extendMode}
              onValueChange={(v) => updateSetting("extendMode", v)}
              trackColor={{ false: "rgba(255,255,255,0.1)", true: `${Colors.accent}80` }}
              thumbColor={settings.extendMode ? Colors.accent : "rgba(255,255,255,0.5)"}
              accessibilityLabel="Extend Mode"
              accessibilityRole="switch"
            />
          </SettingRow>

          <SettingRow label="Auto-play next story" last>
            <Switch
              value={settings.autoPlayNext}
              onValueChange={(v) => updateSetting("autoPlayNext", v)}
              trackColor={{ false: "rgba(255,255,255,0.1)", true: `${Colors.accent}80` }}
              thumbColor={settings.autoPlayNext ? Colors.accent : "rgba(255,255,255,0.5)"}
              accessibilityLabel="Auto-play next story"
              accessibilityRole="switch"
            />
          </SettingRow>
        </View>

        <View style={styles.card}>
          <SectionHeader title="Accessibility" icon="accessibility-outline" />

          <SettingRow label="Story Text Size">
            <ChipSelector
              groupLabel="Story Text Size"
              options={TEXT_SIZES}
              selected={settings.textSize}
              onSelect={(v) => updateSetting("textSize", v as AppSettings["textSize"])}
              getLabel={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
            />
          </SettingRow>

          <SettingRow label="Reduced Motion" last>
            <Switch
              value={settings.reducedMotion}
              onValueChange={(v) => updateSetting("reducedMotion", v)}
              trackColor={{ false: "rgba(255,255,255,0.1)", true: `${Colors.accent}80` }}
              thumbColor={settings.reducedMotion ? Colors.accent : "rgba(255,255,255,0.5)"}
              accessibilityLabel="Reduced Motion"
              accessibilityRole="switch"
            />
          </SettingRow>
          <Text style={styles.syncHint}>
            Story text size applies on top of your device&apos;s own text-size setting.
            Reduced motion also turns on automatically when your device asks for it.
          </Text>
        </View>

        <View style={styles.card}>
          <SectionHeader title="Library" icon="library-outline" />

          <SettingRow label="Sort By">
            <ChipSelector
              groupLabel="Sort By"
              options={SORT_ORDERS.map((s) => s.id)}
              selected={settings.librarySortOrder}
              onSelect={(v) => updateSetting("librarySortOrder", v as AppSettings["librarySortOrder"])}
              getLabel={(v) => SORT_ORDERS.find((s) => s.id === v)?.label || v}
            />
          </SettingRow>

          <SettingRow label="Favorites only">
            <Switch
              value={settings.showFavoritesOnly}
              onValueChange={(v) => updateSetting("showFavoritesOnly", v)}
              trackColor={{ false: "rgba(255,255,255,0.1)", true: `${Colors.accent}80` }}
              thumbColor={settings.showFavoritesOnly ? Colors.accent : "rgba(255,255,255,0.5)"}
              accessibilityLabel="Show favorites only"
              accessibilityRole="switch"
            />
          </SettingRow>

          <SettingRow label="Auto-save stories" last>
            <Switch
              value={settings.autoSave}
              onValueChange={(v) => updateSetting("autoSave", v)}
              trackColor={{ false: "rgba(255,255,255,0.1)", true: `${Colors.accent}80` }}
              thumbColor={settings.autoSave ? Colors.accent : "rgba(255,255,255,0.5)"}
              accessibilityLabel="Auto-save stories"
              accessibilityRole="switch"
            />
          </SettingRow>
        </View>

        <View style={styles.card}>
          <SectionHeader title="Cloud Backup" icon="cloud-outline" />

          <SettingRow label="Sync stories & progress" last>
            <Switch
              value={settings.cloudSyncEnabled}
              disabled={!user}
              onValueChange={(v) => {
                updateSetting("cloudSyncEnabled", v);
                // Kick an immediate sync when turning it on (best-effort).
                if (v) void runSync(true);
              }}
              trackColor={{ false: "rgba(255,255,255,0.1)", true: `${Colors.accent}80` }}
              thumbColor={settings.cloudSyncEnabled && user ? Colors.accent : "rgba(255,255,255,0.5)"}
              accessibilityLabel="Sync stories and progress to the cloud"
              accessibilityRole="switch"
              accessibilityState={{ disabled: !user }}
            />
          </SettingRow>
          {!user && (
            <Text style={styles.syncHint}>
              Sign in to back up your stories and progress across devices.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <SectionHeader title="Legal" icon="document-text-outline" />

          <Pressable
            onPress={() => router.push("/privacy")}
            style={styles.settingRow}
            accessibilityRole="button"
            accessibilityLabel="Open the privacy policy"
            testID="privacy-policy-link"
          >
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
          </Pressable>

          <Pressable
            onPress={() => router.push("/parental-consent")}
            style={[styles.settingRow, styles.settingRowLast]}
            accessibilityRole="button"
            accessibilityLabel="Review parental consent and data choices"
          >
            <Text style={styles.settingLabel}>Parental Consent</Text>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
          </Pressable>
        </View>

        <Pressable
          onPress={handleDeleteAllData}
          style={({ pressed }) => [
            styles.resetBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Delete all data stored on this device"
          testID="delete-all-data-btn"
        >
          <Ionicons name="trash-outline" size={18} color="rgba(255,100,100,0.7)" />
          <Text style={styles.resetBtnText}>Delete All Data</Text>
        </Pressable>

        <Pressable
          onPress={handleReset}
          style={({ pressed }) => [
            styles.resetBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Reset all settings to their defaults"
          testID="reset-settings-btn"
        >
          <Ionicons name="refresh-circle-outline" size={18} color="rgba(255,100,100,0.7)" />
          <Text style={styles.resetBtnText}>Reset to Defaults</Text>
        </Pressable>
        </ResponsiveContainer>
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  screenTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 17,
    color: "#FFFFFF",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${Colors.accent}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
    flexWrap: "wrap",
    gap: 8,
  },
  settingRowLast: { borderBottomWidth: 0 },
  settingLabel: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    minWidth: 100,
  },
  settingControl: {
    flex: 1,
    alignItems: "flex-end",
  },
  syncHint: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-end",
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  chipActive: {
    backgroundColor: `${Colors.accent}20`,
    borderColor: `${Colors.accent}60`,
  },
  chipText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
  },
  chipTextActive: {
    color: Colors.accent,
  },
  volumeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  volumeTrack: {
    flexDirection: "row",
    gap: 4,
    flex: 1,
  },
  volumeSegment: {
    flex: 1,
    height: 20,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  volumeValue: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: Colors.accent,
    minWidth: 24,
    textAlign: "right",
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,100,100,0.2)",
    backgroundColor: "rgba(255,100,100,0.05)",
    marginTop: 4,
    marginBottom: 8,
  },
  resetBtnText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: "rgba(255,100,100,0.7)",
  },
});
