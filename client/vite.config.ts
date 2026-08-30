import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon-16.png", "favicon-32.png", "apple-touch-icon.png"],
      manifest: {
        name: "Tha. Veymandoo Police Station — Vehicles & Vessels Dhaftharu",
        short_name: "Dhaftharu",
        description: "Digital registry of vehicles and vessels for Tha. Veymandoo Police Station.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#050B18",
        theme_color: "#050B18",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Precache only the built app shell (JS/CSS/HTML/icons). Never cache
        // Supabase requests — this app always needs live data, and stale
        // cached records would be actively dangerous in a police registry.
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
            handler: "NetworkOnly",
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
