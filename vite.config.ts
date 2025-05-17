import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import compression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: 'localhost',
    port: 5173,
    hmr: {
      host: 'localhost',
    },
  },
  build: {
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console logs in production
        drop_console: true,
        dead_code: true,
      },
    },
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'charts': ['echarts'],
        },
      },
    },
    // Enable source maps for debugging in production
    sourcemap: false,
  },
  plugins: [
    react(),
    // Add compression for all static assets
    compression({
      algorithm: 'gzip', // gzip compression
      ext: '.gz', // extension to add
      threshold: 10240, // only compress files > 10kb
      deleteOriginFile: false, // keep original files
      filter: /\.(js|css|html|svg|json)$/i, // only compress these file types
    }),
    // Add brotli compression which is more efficient
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false,
      filter: /\.(js|css|html|svg|json)$/i,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true // Enable PWA in development
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}'],
        maximumFileSizeToCacheInBytes: 3000000, // reduce to 3MB
        // Configure runtime caching for external resources
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-awesome-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/firebaseapp\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'firebase-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
            }
          }
        ],
        skipWaiting: true,
        clientsClaim: true,
      },
      includeAssets: [
        'favicon.ico', 
        'apple-touch-icon.png', 
        'favicon.svg', 
        'offline.html',
        'sw-enhancement.js'
      ],
      // Configure strategies for app resources
      strategies: 'injectManifest',
      injectRegister: 'auto',
      // Configure the service worker
      injectManifest: {
        injectionPoint: 'self.__WB_MANIFEST',
        swSrc: 'public/sw-enhancement.js',
        swDest: 'dist/sw.js',
      },
      manifest: {
        name: 'FinFlow - Finance Tracker',
        short_name: 'FinFlow',
        description: 'Track your personal finances with ease',
        theme_color: '#8b5cf6',
        background_color: '#ffffff',
        start_url: '/',
        display: 'standalone',
        categories: ['finance', 'productivity', 'utilities'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
        ]
      }
    })
  ]
});

