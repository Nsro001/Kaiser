import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],

  // 🚫 EVITAR QUE VITE OPTIMICE PDFMAKE
  optimizeDeps: {
    exclude: ["pdfmake"],
  },

  // 🚫 EVITAR QUE PDFMAKE SE MUEVA AL BUNDLE
  build: {
    sourcemap: false,
    rollupOptions: {
      external: ["pdfmake", "pdfmake/build/pdfmake.js", "pdfmake/build/vfs_fonts.js"],
    },
  },

  // Alias para rutas tipo "@/..."
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Solo para desarrollo
  server: {
    port: 5173,
  },
});
