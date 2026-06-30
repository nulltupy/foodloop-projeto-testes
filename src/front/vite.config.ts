import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  test: {
    environment: 'jsdom',
    // Alinha a origem do jsdom ao baseUrl usado pelos handlers dos testes.
    environmentOptions: { jsdom: { url: 'http://localhost:3010' } },
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
  },
});
