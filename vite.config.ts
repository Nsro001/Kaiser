// vite.config.ts

import { defineConfig } from 'vite';
// Importa 'resolve' para manejar las rutas absolutas.
// Usa 'path.resolve' si estás en un entorno Node.js estándar.
import path from 'path'; 
// Asumo que tienes un plugin como React o Vue aquí:
// import react from '@vitejs/plugin-react'; 

export default defineConfig(({ mode }) => ({
  // plugins: [react()], // Tus plugins aquí

  // <<<<<<<< AÑADE ESTA SECCIÓN DE RESOLUCIÓN DE ALIAS >>>>>>>
  resolve: {
    alias: {
      // Mapea "@/" para que apunte directamente a la carpeta "/src" de tu proyecto
      '@': path.resolve(__dirname, './src'),
    },
  },
  // <<<<<<<< FIN SECCIÓN DE RESOLUCIÓN >>>>>>>
  

  // Tus configuraciones anteriores para pdfmake siguen aquí:
  optimizeDeps: {
    include: ['pdfmake/build/pdfmake', 'pdfmake/build/vfs_fonts'],
  },
  build: {
    rollupOptions: {
      moduleContext: {
        './node_modules/pdfmake/build/vfs_fonts.js': 'window',
      },
    },
  },
}));