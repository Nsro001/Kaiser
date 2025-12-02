import { defineConfig } from 'vite';
import path from 'path'; 

export default defineConfig(({ mode }) => ({
  // ... (tus plugins) ...
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    // Esto debería resolver el error de build de Rollup y el 404 de fuentes
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('pdfmake')) {
            return 'pdfmake-chunk'; // Crea un chunk separado para pdfmake
          }
        }
      },
      moduleContext: {
        './node_modules/pdfmake/build/vfs_fonts.js': 'window',
      },
    },
  },
}));