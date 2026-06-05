import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useNetworkStatus } from "@/lib/useNetworkStatus";
import { getOnboardingComplete } from "@/lib/storage";
import { queryClient, setAuthTokenGetter } from "@/lib/query-client";
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

SplashScreen.preventAutoHideAsync();

function OfflineIndicator() {
  const { isConnected } = useNetworkStatus();
  if (isConnected) return null;
  return <OfflineBanner />;
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.primary },
        animation: "fade",
      }}
    >
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

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      getOnboardingComplete()
        .then((done) => {
          if (!done) {
            router.replace("/welcome");
          }
        })
        .catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
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
