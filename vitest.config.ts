import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@shared': path.resolve(__dirname, './shared'),
      'react-native': 'react-native-web',
      zod: path.resolve(__dirname, 'node_modules/zod/index.cjs'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    // Force test mode so importing server/index.ts never triggers its
    // module-level server.listen(). Vitest sets NODE_ENV=test by default, but
    // only when it is unset; some hosts export an ambient NODE_ENV/PORT that
    // would otherwise make the integration test bind a real port and flake.
    env: { NODE_ENV: 'test' },
    setupFiles: ['__tests__/setup.ts'],
    include: [
      'server/**/*.test.ts',
      'lib/**/*.test.ts',
      'shared/**/*.test.ts',
      'constants/**/*.test.ts',
      '__tests__/**/*.test.ts',
    ],
    exclude: ['node_modules', 'server_dist', 'static-build'],
    coverage: {
      provider: 'v8',
      include: ['server/**/*.ts', 'lib/**/*.ts', 'shared/media/**/*.ts'],
      exclude: [
        'server/templates/**',
        '**/*.test.ts',
        '**/index.ts',
      ],
      thresholds: {
        branches: 80,
      },
    },
    testTimeout: 60000,
  },
});


