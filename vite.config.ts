import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vercel serves the app from the domain root. GitHub Pages serves it from
// /chandhaa/. Keep the correct asset base for each deployment target.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build"
    ? (process.env.VERCEL ? "/" : "/chandhaa/")
    : "/",
  server: {
    port: 5173,
  },
}));
