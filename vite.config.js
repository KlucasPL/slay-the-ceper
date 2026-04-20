import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/slay-the-ceper/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icon-*.png'],
      manifest: {
        name: 'Usiec Cepra',
        short_name: 'Usiec Cepra',
        description: 'Góralska gra karciana roguelike – Slay the Ceper',
        theme_color: '#1a0a00',
        background_color: '#1a0a00',
        display: 'standalone',
        orientation: 'any',
        scope: '/slay-the-ceper/',
        start_url: '/slay-the-ceper/',
        lang: 'pl',
        icons: [
          { src: 'icon-72x72.png', sizes: '72x72', type: 'image/png' },
          { src: 'icon-96x96.png', sizes: '96x96', type: 'image/png' },
          { src: 'icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: 'icon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: 'icon-152x152.png', sizes: '152x152', type: 'image/png' },
          { src: 'icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,svg,webp,mp3,ogg,wav,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\/slay-the-ceper\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'slay-the-ceper-assets',
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/**', 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      include: ['src/state/**/*.js', 'src/data/**/*.js'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
