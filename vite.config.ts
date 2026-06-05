import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false
    }
  },
  build: {
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          utils: ['framer-motion', 'date-fns', 'clsx'],
          supabase: ['@supabase/supabase-js']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        ecma: 5
      },
      format: {
        ecma: 5
      }
    },
    cssCodeSplit: true,
    sourcemap: mode === 'development'
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion'],
    exclude: ['@supabase/supabase-js']
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'pwa-icons/*.png'],
      devOptions: {
        enabled: true,
        type: 'module'
      },
      manifest: {
        id: '/',
        name: 'B-Reserve - Voyages & Réservations',
        short_name: 'B-Reserve',
        description: 'Votre compagnon de voyage - Réservez vols, hôtels, voitures et plus encore en quelques clics',
        theme_color: '#0c4a6e',
        background_color: '#0c4a6e',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/?source=pwa',
        lang: 'fr',
        dir: 'ltr',
        categories: ['travel', 'booking', 'lifestyle'],
        prefer_related_applications: false,
        icons: [
          {
            src: '/pwa-icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-icons/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          {
            src: '/pwa-icons/screenshot-mobile.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Accueil B-Reserve Mobile'
          },
          {
            src: '/pwa-icons/screenshot-desktop.png',
            sizes: '1920x1080',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Accueil B-Reserve Desktop'
          }
        ],
        shortcuts: [
          {
            name: 'Rechercher des vols',
            short_name: 'Vols',
            description: 'Trouvez les meilleurs tarifs de vols',
            url: '/flights?source=pwa',
            icons: [{ src: '/pwa-icons/shortcut-flights.png', sizes: '192x192' }]
          },
          {
            name: 'Rechercher des hôtels',
            short_name: 'Hôtels',
            description: 'Réservez votre hébergement',
            url: '/hotels?source=pwa',
            icons: [{ src: '/pwa-icons/shortcut-hotels.png', sizes: '192x192' }]
          },
          {
            name: 'Mes réservations',
            short_name: 'Réservations',
            description: 'Consultez vos réservations',
            url: '/dashboard?source=pwa',
            icons: [{ src: '/pwa-icons/shortcut-bookings.png', sizes: '192x192' }]
          },
          {
            name: 'Location de voitures',
            short_name: 'Voitures',
            description: 'Louez une voiture',
            url: '/cars?source=pwa',
            icons: [{ src: '/pwa-icons/shortcut-cars.png', sizes: '192x192' }]
          }
        ],
        related_applications: [],
        handle_links: 'preferred'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff,woff2,webp}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/supabase/, /^\/auth\/callback/, /^\/~oauth/],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'storage-images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|avif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'local-images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/storage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gcs-assets-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
