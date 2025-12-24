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
      target: 'es2020',
      // Increase chunk size warning limit (Firebase is large)
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          // Better code splitting for faster initial load
          manualChunks: {
            'react-core': ['react', 'react-dom'],
            'react-router': ['react-router-dom'],
            'firebase-app': ['firebase/app'],
            'firebase-auth': ['firebase/auth'],
            'firebase-firestore': ['firebase/firestore'],
            'icons': ['react-icons'],
            'recharts': ['recharts']
          }
        }
      },
      // Enable source map for debugging (can disable in prod)
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
