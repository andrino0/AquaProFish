import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Netlify serves from the domain root; GitHub Pages uses the repository subpath.
  base: process.env.NETLIFY === 'true' ? '/' : '/AquaProFish/',
});
