import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Repo: afey10/chandhaa -> served at https://afey10.github.io/chandhaa/
// Only applied for production builds; local dev still serves from /.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/chandhaa/" : "/",
  server: {
    port: 5173,
  },
}));
