import { Alert, Platform } from "react-native";

/**
 * Cross-platform destructive-action confirmation. react-native-web's Alert.alert
 * is a no-op (`static alert() {}` — it never shows anything and never invokes a
 * button's onPress), so a plain Alert.alert call silently drops both the prompt
 * and the action on web. This falls back to window.confirm there.
 */
export function confirmDestructive(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void
): void {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: confirmLabel, style: "destructive", onPress: onConfirm },
  ]);
}
