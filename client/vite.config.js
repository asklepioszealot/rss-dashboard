import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Electron in-process Express 3737'de; standalone server 3001'de.
      // Hangisi açıksa o çalışsın — dev'de Electron çalıştırıyorsan 3737.
      '/api': process.env.VITE_API_TARGET || 'http://localhost:3737',
    },
  },
});
