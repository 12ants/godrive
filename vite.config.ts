import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    allowedHosts: true as const,
    port: 3000,
    // External tooling can disable HMR when live file updates would be disruptive.
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
