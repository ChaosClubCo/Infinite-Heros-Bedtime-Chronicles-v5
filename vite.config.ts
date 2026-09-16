import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom', 'react-dom/client'],
  },
  optimizeDeps: {
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
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
