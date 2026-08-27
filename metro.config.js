const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  /\.local\/state\/workflow-logs\/.*/,
];

// The repository contains two frontends:
// - Vite resolves `@` to ./src via vite.config.ts.
// - Expo Router lives at the repository root and historically imports
//   root-level modules such as @/constants and @/components.
//
// Expo CLI otherwise consumes tsconfig.json, where `@/*` is intentionally
// mapped to src/* for the Vite app. Resolve the Expo alias explicitly here
// so Metro does not reinterpret root-level Expo imports as src/* imports.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("@/")) {
    const rootModule = path.resolve(__dirname, moduleName.slice(2));
    return context.resolveRequest(context, rootModule, platform);
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
