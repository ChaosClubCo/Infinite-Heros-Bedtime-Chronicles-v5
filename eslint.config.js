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
  {
    // React Compiler correctness rules (eslint-plugin-react-hooks v6). These
    // surface real-but-advisory hints (impure render, refs/setState in effects)
    // across pre-existing screens. They were never enforced while the toolchain
    // was pinned to ESLint 10, which crashed eslint-plugin-react before any rule
    // could run. Kept as warnings here so they stay visible in lint output
    // without blocking CI; address them incrementally rather than in one risky
    // cross-screen pass.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
]);
