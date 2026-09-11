import React, { type ComponentProps } from "react";
import { View, Platform, type ViewProps } from "react-native";
import Animated from "react-native-reanimated";

type ReanimatedViewProps = ComponentProps<typeof Animated.View>;

interface AnimatedViewProps extends Omit<ViewProps, "style"> {
  entering?: ReanimatedViewProps["entering"];
  exiting?: ReanimatedViewProps["exiting"];
  layout?: ReanimatedViewProps["layout"];
  style?: ReanimatedViewProps["style"];
  children?: React.ReactNode;
}

export function AnimatedView({ children, entering, exiting, layout, style, ...props }: AnimatedViewProps) {
  if (Platform.OS === "web") {
    // Disable layout animations on Web to avoid elements getting stuck at opacity: 0
    return (
      // intentional: reanimated style values are plain view styles once
      // animations are disabled on web
      <View style={style as ViewProps["style"]} {...props}>
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
