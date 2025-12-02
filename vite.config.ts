import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuración básica para React + Vite + Vercel
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
  },
  server: {
    port: 5173,
  },
});
