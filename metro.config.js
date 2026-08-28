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
// - Shared client/server contracts historically use @shared/*.
//
// Keep Vite's alias semantics untouched and make the Expo/Metro aliases
// explicit at this boundary.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("@/")) {
    const rootModule = path.resolve(__dirname, moduleName.slice(2));
    return context.resolveRequest(context, rootModule, platform);
  }

  if (moduleName.startsWith("@shared/")) {
    const sharedModule = path.resolve(
      __dirname,
      "shared",
      moduleName.slice("@shared/".length),
    );
    return context.resolveRequest(context, sharedModule, platform);
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
