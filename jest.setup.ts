// Silence expected console.error calls from React error boundary tests and RN warnings
const originalConsoleError = console.error;
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (
      msg.includes('Warning:') ||
      msg.includes('Error boundaries') ||
      msg.includes('Each child in a list') ||
      msg.includes('act(') ||
      msg.includes('Caught error') ||
      msg.startsWith('The above error occurred')
    ) {
      return;
    }
    originalConsoleError(...args);
  });
});
afterEach(() => {
  jest.restoreAllMocks();
});

// Reanimated v4: manual mock — react-native-reanimated/mock requires react-native-worklets
// which loads native binaries unavailable in the Jest Node environment.
// Note: require() inside factory avoids jest.mock hoisting issues with top-level imports.
jest.mock('react-native-reanimated', () => {
  const { View, Text, Image, ScrollView } = require('react-native');
  const createAnimatedComponent = (Component: unknown) => Component;
  const stub = {
    duration: function () { return this; },
    delay: function () { return this; },
    springify: function () { return this; },
    damping: function () { return this; },
    stiffness: function () { return this; },
    withInitialValues: function () { return this; },
    easing: function () { return this; },
    reduceMotion: function () { return this; },
  };
  return {
    __esModule: true,
    default: { createAnimatedComponent, View, Text, Image, ScrollView },
    createAnimatedComponent,
    Animated: { View, Text, Image, ScrollView, createAnimatedComponent },
    useSharedValue: jest.fn((v: unknown) => ({ value: v, addListener: jest.fn(), removeListener: jest.fn() })),
    useAnimatedStyle: jest.fn((fn: () => unknown) => { try { return fn(); } catch { return {}; } }),
    useAnimatedProps: jest.fn((fn: () => unknown) => { try { return fn(); } catch { return {}; } }),
    useDerivedValue: jest.fn((fn: () => unknown) => ({ value: fn() })),
    useAnimatedRef: jest.fn(() => ({ current: null })),
    useAnimatedScrollHandler: jest.fn(() => ({})),
    useAnimatedReaction: jest.fn(),
    withTiming: jest.fn((v: unknown) => v),
    withSpring: jest.fn((v: unknown) => v),
    withDelay: jest.fn((_: unknown, v: unknown) => v),
    withSequence: jest.fn((...vs: unknown[]) => vs[vs.length - 1]),
    withRepeat: jest.fn((v: unknown) => v),
    withDecay: jest.fn((v: unknown) => v),
    runOnJS: jest.fn((fn: unknown) => fn),
    runOnUI: jest.fn((fn: unknown) => fn),
    cancelAnimation: jest.fn(),
    measure: jest.fn(),
    scrollTo: jest.fn(),
    FadeIn: { ...stub },
    FadeOut: { ...stub },
    FadeInDown: { ...stub },
    FadeInUp: { ...stub },
    FadeOutDown: { ...stub },
    FadeOutUp: { ...stub },
    SlideInRight: { ...stub },
    SlideInLeft: { ...stub },
    SlideOutRight: { ...stub },
    SlideOutLeft: { ...stub },
    ZoomIn: { ...stub },
    ZoomOut: { ...stub },
    BounceIn: { ...stub },
    Layout: { ...stub },
    Easing: {
      linear: jest.fn((t: number) => t),
      ease: jest.fn((t: number) => t),
      bezier: jest.fn(() => jest.fn((t: number) => t)),
      in: jest.fn((fn: unknown) => fn),
      out: jest.fn((fn: unknown) => fn),
      inOut: jest.fn((fn: unknown) => fn),
    },
    ReduceMotion: { System: 'system', Always: 'always', Never: 'never' },
  };
});

// expo-haptics: no native module in tests
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// expo-linear-gradient: render children inside a plain View
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, style, testID }: { children?: unknown; style?: object; testID?: string }) =>
      React.createElement(View, { style, testID }, children),
  };
});

// react-native-safe-area-context: no SafeAreaProvider needed in unit tests
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    useSafeAreaInsets: jest.fn(() => ({ top: 0, right: 0, bottom: 0, left: 0 })),
    useSafeAreaFrame: jest.fn(() => ({ x: 0, y: 0, width: 375, height: 812 })),
    SafeAreaProvider: ({ children }: { children: unknown }) => children,
    SafeAreaView: ({ children, style }: { children: unknown; style?: object }) =>
      React.createElement(require('react-native').View, { style }, children),
    SafeAreaConsumer: ({ children }: { children: (insets: object) => unknown }) =>
      children({ top: 0, right: 0, bottom: 0, left: 0 }),
    initialWindowMetrics: { insets: { top: 0, right: 0, bottom: 0, left: 0 }, frame: { x: 0, y: 0, width: 375, height: 812 } },
  };
});

// @expo/vector-icons: no font loading in tests
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  MaterialIcons: () => null,
  FontAwesome: () => null,
  FontAwesome5: () => null,
  AntDesign: () => null,
  Entypo: () => null,
  Feather: () => null,
  MaterialCommunityIcons: () => null,
}));

// expo (for reloadAppAsync used in ErrorFallback)
jest.mock('expo', () => ({
  reloadAppAsync: jest.fn().mockResolvedValue(undefined),
}));

// PulsingOrb: lightweight stub (native animations not needed in tests)
jest.mock('@/components/PulsingOrb', () => ({
  LoadingOrb: () => null,
  PulsingOrb: () => null,
}));
