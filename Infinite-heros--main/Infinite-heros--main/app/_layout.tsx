import * as Sentry from "@sentry/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useNetworkStatus } from "@/lib/useNetworkStatus";
import { queryClient, setAuthTokenGetter } from "@/lib/query-client";
import { ConsentProvider, useConsent } from "@/lib/ConsentContext";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { ProfileProvider } from "@/lib/ProfileContext";
import { SettingsProvider } from "@/lib/SettingsContext";
import { StatusBar } from "expo-status-bar";
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";
import { Bangers_400Regular } from "@expo-google-fonts/bangers";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import Colors from "@/constants/colors";

// Initialize Sentry for client-side error tracking.
// No-ops gracefully when EXPO_PUBLIC_SENTRY_DSN is unset.
if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
}

SplashScreen.preventAutoHideAsync();

function OfflineIndicator() {
  const { isConnected } = useNetworkStatus();
  if (isConnected) return null;
  return <OfflineBanner />;
}

function RootLayoutNav() {
  const { isLoaded, isConsented } = useConsent();

  // Keep the splash up until the consent record has been read — combined
  // with the Stack.Protected guard below, no protected screen can mount (or
  // fire network requests) on ANY entry path — cold start, deep link, web
  // URL, or restored navigation state — before consent is known.
  useEffect(() => {
    if (isLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isLoaded]);

  if (!isLoaded) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.primary },
        animation: "fade",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="parental-consent"
        options={{ animation: "fade", gestureEnabled: false }}
      />
      <Stack.Screen
        name="privacy"
        options={{ animation: "slide_from_right" }}
      />
      {/* COPPA: everything below is unreachable until parental consent is
          given — un-consented deep links fall back to index (the launch
          gate), which redirects to the consent screen. */}
      <Stack.Protected guard={isConsented}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="welcome"
          options={{ animation: "fade", gestureEnabled: false }}
        />
        <Stack.Screen
          name="quick-create"
          options={{ animation: "slide_from_bottom", presentation: "modal" }}
        />
        <Stack.Screen
          name="settings"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="story-details"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="madlibs"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="sleep-setup"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="story"
          options={{
            presentation: "fullScreenModal",
            animation: "fade",
          }}
        />
        <Stack.Screen
          name="completion"
          options={{
            presentation: "fullScreenModal",
            animation: "fade",
          }}
        />
        <Stack.Screen
          name="trophies"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="voice-chat"
          options={{ animation: "slide_from_right" }}
        />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Bangers_400Regular,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // Splash hiding + consent gating live in RootLayoutNav (it needs the
  // ConsentContext); the onboarding redirect lives in app/index.tsx (the
  // launch gate, backed by lib/launch-gate.ts).
  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <ConsentProvider>
        <AuthProvider>
          <AuthBridge />
          <QueryClientProvider client={queryClient}>
            <ProfileProvider>
              <SettingsProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <KeyboardProvider>
                    <StatusBar style="light" />
                    <OfflineIndicator />
                    <RootLayoutNav />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </SettingsProvider>
            </ProfileProvider>
          </QueryClientProvider>
        </AuthProvider>
      </ConsentProvider>
    </ErrorBoundary>
  );
}

function AuthBridge() {
  const { getIdToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(getIdToken);
  }, [getIdToken]);
  return null;
}
