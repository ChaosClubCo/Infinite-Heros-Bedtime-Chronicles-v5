import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
      'react': path.resolve(rootDir, 'node_modules/react'),
      'react-dom': path.resolve(rootDir, 'node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom', 'react-dom/client'],
  },
  optimizeDeps: {
    entries: ['index.html', 'src/**/*.{ts,tsx}'],
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'motion/react',
      'lucide-react',
      'canvas-confetti',
    ],
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
    watch: {
      ignored: [
        '**/app/**',
        '**/components/**',
        '**/lib/**',
        '**/server/**',
        '**/__tests__/**',
        '**/docs/**',
        '**/agents/**',
        '**/scripts/**',
        '**/supabase/**',
        '**/patches/**',
        '**/.claude/**',
        '**/.codex/**',
        '**/.github/**',
      ],
    },
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
