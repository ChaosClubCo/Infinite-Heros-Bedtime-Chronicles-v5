import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@shared': path.resolve(__dirname, './shared'),
      'react-native': 'react-native-web',
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./__tests__/setup.ts'],
    // `constants/**` was missing, so the five test files in that folder had
    // never executed — including colors.test.ts, which is why a test named for
    // WCAG AA compliance could assert nothing of the kind without being noticed.
    include: [
      'server/**/*.test.ts',
      'lib/**/*.test.ts',
      '__tests__/**/*.test.ts',
      'shared/**/*.test.ts',
      'constants/**/*.test.ts',
    ],
    exclude: ['node_modules', 'server_dist', 'static-build', '__tests__/components/**'],
    coverage: {
      provider: 'v8',
      include: ['server/**/*.ts', 'lib/**/*.ts'],
      exclude: [
        'server/replit_integrations/**',
        'server/templates/**',
        'server/db.ts',
        'server/auth.ts',
        'server/video.ts',
        'lib/SettingsContext.tsx',
        'lib/use*.ts',
        'lib/scene-handoff.ts',
        'lib/clearDestructive.ts',
        'lib/heroStorage.ts',
        'lib/query-client.ts',
        '**/*.test.ts',
        '**/index.ts',
      ],
      thresholds: {
        branches: 80,
      },
    },
    testTimeout: 60000,
    hookTimeout: 60000,
    maxWorkers: 3,
  },
});
