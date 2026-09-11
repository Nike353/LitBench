import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: 1450,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('/three/') ||
            id.includes('force-graph') ||
            id.includes('three-render-objects')
          ) {
            return 'graph-engine';
          }
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/zustand/')
          ) {
            return 'react-runtime';
          }
          if (id.includes('/lucide-react/')) return 'icons';
          return undefined;
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/domain/**', 'src/services/**', 'src/store/**'],
    },
  },
});
