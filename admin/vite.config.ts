import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import pkg from "./package.json" with { type: "json" };

/// Panoul se livrează sub `/admin`, ca aplicație separată de site-ul public.
/// `base` trebuie să fie exact calea aceea, altfel bundle-ul își cere fișierele
/// de la rădăcină și pagina rămâne albă.
export default defineConfig({
  base: "/admin/",
  // Versiunea pachetului ajunge în bundle, ca panoul să poată spune ce rulează.
  define: { __ADMIN_VERSION__: JSON.stringify(pkg.version) },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  envDir: path.resolve(import.meta.dirname, ".."),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: { host: true, port: 5174 },
});
