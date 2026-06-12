// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(), // Tailwind v4 via Vite plugin — handles @theme, @utility etc.
    react(),
  ],
});