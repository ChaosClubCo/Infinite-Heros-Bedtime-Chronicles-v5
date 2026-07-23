import React from "react";
import { View, StyleSheet, useWindowDimensions, type ViewProps } from "react-native";

interface ResponsiveContainerProps extends ViewProps {
  maxWidth?: number;
  children?: React.ReactNode;
}

export function ResponsiveContainer({ children, maxWidth = 768, style, ...props }: ResponsiveContainerProps) {
  const { width } = useWindowDimensions();
  const isLarge = width > maxWidth;

  return (
    <View
      style={[
        styles.container,
        isLarge && { maxWidth, alignSelf: "center", width: "100%" },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
});
