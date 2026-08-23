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
      include: ['server/**/*.ts', 'lib/**/*.ts'],
      exclude: [
        'server/replit_integrations/**',
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


