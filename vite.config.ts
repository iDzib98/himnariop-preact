import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [],
      manifest: {
        name: 'Himnario Evangélico Presbiteriano',
        short_name: 'HimnarioP',
        description: 'Himnario Evangélico Presbiteriano - Solo a Dios la Gloria',
        lang: 'es',
        theme_color: '#3f51b5',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'assets/icons/favicon.png',
            sizes: '48x48',
            type: 'image/png'
          },
          {
            src: 'assets/icons/192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'assets/icons/512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'assets/icons/m192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'assets/icons/m512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2,json,mjs}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/himnos\//],
        runtimeCaching: [
          {
            urlPattern: /\/himnos\/.*\.pdf$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pdf-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /https:\/\/a16016344\.github\.io\/himnariop\/himno\/mp3\/.*\.mp3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'pdfjs': ['pdfjs-dist']
        }
      }
    }
  }
});
