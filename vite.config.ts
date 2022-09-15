import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
      manifest: {
        name: "Puddle Play",
        short_name: "PuddlePlay",
        description: "Puddle Play",
        theme_color: "#ffffff",
        icons: [
          {
            src: "puddle-play_512x512.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "puddle-play_512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
