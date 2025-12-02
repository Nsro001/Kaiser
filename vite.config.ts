// vite.config.ts simplificado si la importación dinámica funciona
import { defineConfig } from 'vite';
import path from 'path'; 

export default defineConfig(({ mode }) => ({
  // ... plugins ...
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Elimina optimizeDeps y build.rollupOptions si ya no los necesitas
}));