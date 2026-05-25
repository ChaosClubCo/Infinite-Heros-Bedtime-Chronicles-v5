const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
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
