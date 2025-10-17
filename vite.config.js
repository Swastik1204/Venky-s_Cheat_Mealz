import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react','react-dom'],
          firebase: ['firebase/app','firebase/auth','firebase/firestore'],
          vendor: ['react-router-dom','react-icons']
        }
      }
    }
  },
  resolve: {
    // Ensure a single React instance across the app to avoid "Invalid hook call"
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime'),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
  includeAssets: ['icons/logo.png', 'favicon.ico'],
      manifest: {
        name: 'Venky’s Chicken Xperience Durgapur',
        short_name: 'Venky’s',
        description: 'Local food ordering with a fast POS for billers.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#facc15',
        icons: [
          { src: '/icons/logo.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/logo.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
      },
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      // We register the SW manually via virtual:pwa-register in src/main.jsx
      injectRegister: null,
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
