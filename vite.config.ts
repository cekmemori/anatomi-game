import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        name: "AnatomiVerse 3D",
        short_name: "AnatomiVerse",
        description:
          "Game edukatif anatomi tubuh manusia 3D untuk siswa SMA — jelajah, misi, dan kuis interaktif.",
        lang: "id",
        theme_color: "#070B14",
        background_color: "#070B14",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        scope: "/",
        categories: ["education", "games"],
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,wasm}"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith(".glb"),
            handler: "CacheFirst",
            options: {
              cacheName: "anatomy-models",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: ["**/server/**", "**/server/data/**", "**/data/**"],
    },
    proxy: {
      "/socket.io": { target: "http://localhost:3001", ws: true },
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
  },
});
