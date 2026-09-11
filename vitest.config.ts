import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./__tests__/setup.ts'],
    include: ['server/**/*.test.ts', 'lib/**/*.test.ts', '__tests__/**/*.test.ts', 'shared/**/*.test.ts'],
    exclude: ['node_modules', 'server_dist', 'static-build', '__tests__/components/**'],
    coverage: {
      provider: 'v8',
      include: ['server/**/*.ts', 'lib/**/*.ts', 'shared/media/**/*.ts'],
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
