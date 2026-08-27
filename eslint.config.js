const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // eslint-plugin-react (bundled in eslint-config-expo) calls context.getFilename()
    // to auto-detect the React version, but that method was removed in ESLint 10.
    // Hardcoding the version bypasses detection and prevents the TypeError crash.
    settings: {
      react: { version: '19.0' },
    },
  },
  {
    // `.agents/**` holds vendored agent-skill documentation (e.g. Remotion
    // skill assets that import the uninstalled `remotion` package). It is not
    // part of the app build; mirror the `.agents/**` exclude in tsconfig.json
    // so ESLint and tsc stay consistent and CI never walks these files.
    ignores: [
      "dist/**",
      "server_dist/**",
      "static-build/**",
      "archive/**",
      "coverage/**",
      ".agents/**",
      ".release-evidence/**",
    ],
  },
  {
    // TypeScript validates all imports at compile time, making these rules
    // redundant and prone to false positives with path aliases (@/*).
    // See: https://typescript-eslint.io/troubleshooting/typed-linting/performance/#eslint-plugin-import
    rules: {
      'import/no-unresolved': 'off',
      'import/namespace': 'off',
    },
  },
]);
