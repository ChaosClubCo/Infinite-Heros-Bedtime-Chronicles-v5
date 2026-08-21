import React from "react";
import { View, Text, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import Colors from "@/constants/colors";
import { useScreenInsets } from "@/lib/useScreenInsets";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];

// Inactive tab foreground. The previous rgba(255,255,255,0.4) composited to
// roughly 3.8:1 against the tab bar — below the 4.5:1 WCAG AA floor, and it was
// carrying 9px uppercase letterspaced text. At 0.6 alpha the same hue measures
// about 7.2:1, and the label is now 11px.
const INACTIVE_TINT = "rgba(255,255,255,0.6)";

interface TabIconProps {
  name: IoniconsName;
  focused: boolean;
  label: string;
  isCreate?: boolean;
}

function TabIcon({ name, focused, label, isCreate }: TabIconProps) {
  if (isCreate) {
    return (
      <View style={styles.createBtnWrap} accessibilityLabel="Create a new story" accessibilityRole="button">
        <View style={styles.createBtn}>
          <Ionicons name="add" size={28} color="#FFF" />
        </View>
        <Text style={[styles.tabLabel, { color: focused ? Colors.accent : INACTIVE_TINT }]}>
          {label}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.tabIconWrap}>
      <Ionicons
        name={focused ? name : (`${String(name)}-outline` as IoniconsName)}
        size={24}
        color={focused ? Colors.accent : INACTIVE_TINT}
      />
      <Text style={[styles.tabLabel, focused && { color: Colors.accent }]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { bottomInset } = useScreenInsets();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const tabWidth = isWeb ? Math.min(width, 600) : width;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "rgba(16, 16, 34, 0.92)",
          borderTopColor: "rgba(15, 15, 189, 0.2)",
          borderTopWidth: 1,
          height: 60 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
          width: tabWidth,
          left: isWeb ? (width - tabWidth) / 2 : 0,
          ...(isWeb ? {
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderLeftColor: "rgba(15, 15, 189, 0.2)",
            borderRightColor: "rgba(15, 15, 189, 0.2)",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          } : {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 20,
          }),
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: INACTIVE_TINT,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarAccessibilityLabel: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          tabBarAccessibilityLabel: "Story library",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="book" focused={focused} label="Library" />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarAccessibilityLabel: "Create a story",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="add-circle" focused={focused} label="Create" isCreate />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          tabBarAccessibilityLabel: "Saved stories",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="heart" focused={focused} label="Saved" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarAccessibilityLabel: "Profile and settings",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person" focused={focused} label="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  tabLabel: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 11,
    letterSpacing: 0.6,
    color: INACTIVE_TINT,
    textTransform: "uppercase",
  },
  createBtnWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    marginTop: -20,
  },
  createBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.deepIndigo,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.deepIndigo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
});
