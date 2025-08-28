import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    // setupFiles: './src/tests/setup.ts', // We can add this later if needed
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
