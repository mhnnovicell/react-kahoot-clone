import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import viteImagemin from 'vite-plugin-imagemin';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      base: '/',
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        sourcemap: true,
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2,ts}',
        ],
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Quizazoid',
        short_name: 'Quizazoid',
        description:
          'Quizazoid is a quiz management system that allows you to create, manage, and analyze quizzes with ease.',
        theme_color: '#501f87',
        background_color: '#501f87',
        icons: [
          {
            src: 'src/assets/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'src/assets//web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'src/assets//favicon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
          },
        ],
        screenshots: [
          {
            src: 'src/assets//web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Quizazoid',
          },
          {
            src: 'src/assets//web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Quizazoid',
          },
        ],
      },
    }),
    basicSsl({
      domains: ['https://localhost:5174'],
    }),
    viteImagemin({
      gifsicle: {
        optimizationLevel: 7,
        interlaced: false,
      },
      optipng: {
        optimizationLevel: 7,
      },
      mozjpeg: {
        quality: 20,
      },
      pngquant: {
        quality: [0.8, 0.9],
        speed: 4,
      },
      webp: { quality: 50 },
      svgo: {
        plugins: [
          {
            name: 'removeViewBox',
          },
          {
            name: 'removeEmptyAttrs',
            active: false,
          },
        ],
      },
    }),
  ],
  server: {
    https: true,
    port: 5174,
  },
});
