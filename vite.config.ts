import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import {VitePWA} from "vite-plugin-pwa";


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        sourcemap: true,
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,json}"],
        // navigateFallbackDenyList: [/^\/_api/, /^\/_api_docs/]
      },
      injectRegister: "script",
      manifest: {
        name: 'Vue Vite PWA',
        short_name: 'Vue Vite',
        description: 'Vue Vite Test',
        theme_color: '#000000',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    outDir: './dist',
    emptyOutDir: true, // also necessary
  }
})
