import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@views': path.resolve(__dirname, './src/views'),
      '@layout': path.resolve(__dirname, './src/layout'),
      '@components': path.resolve(__dirname, './src/components'),
    },
  },
  server: {
    port: 5173,
  },
});
