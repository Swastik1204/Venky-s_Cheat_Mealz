import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// __dirname replacement in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const proxyTarget = env.VITE_API_PROXY_TARGET || env.VITE_DEV_API_BASE_URL || env.VITE_API_BASE_URL || 'http://localhost:3000'
  return {
    build: {
      // Enable minification and tree-shaking
      minify: 'esbuild',
      cssMinify: 'esbuild',
      target: 'es2020',
      // Increase chunk size warning limit (Firebase is large)
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          // Better code splitting for faster initial load
          // NOTE: react-icons and recharts are NOT listed here so Vite can tree-shake them
          manualChunks: {
            'react-core': ['react', 'react-dom'],
            'react-router': ['react-router-dom'],
            'firebase-app': ['firebase/app'],
            'firebase-auth': ['firebase/auth'],
            'firebase-firestore': ['firebase/firestore'],
          }
        }
      },
      // Disable source maps in production
      sourcemap: false,
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
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/Logo.png', 'favicon.ico'],
        manifest: {
          name: 'Venky’s Chicken Xperience Durgapur',
          short_name: 'Venky’s',
          description: 'Local food ordering with a fast POS for billers.',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#facc15',
          // Place icon-192.png, icon-512.png, icon-512-maskable.png in public/icons/ before deploying
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            { src: 'icons/Logo.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' },
          ]
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
  }
})
