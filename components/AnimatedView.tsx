import React from "react";
import { View, Platform, type ViewProps } from "react-native";
import Animated from "react-native-reanimated";

interface AnimatedViewProps extends ViewProps {
  entering?: any;
  exiting?: any;
  layout?: any;
  children?: React.ReactNode;
}

export function AnimatedView({ children, entering, exiting, layout, style, ...props }: AnimatedViewProps) {
  if (Platform.OS === "web") {
    // Disable layout animations on Web to avoid elements getting stuck at opacity: 0
    return (
      <View style={style} {...props}>
        {children}
      </View>
    );
  }
  return (
    <Animated.View entering={entering} exiting={exiting} layout={layout} style={style} {...props}>
      {children}
    </Animated.View>
  );
}
