import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  server: {
    proxy: {
      // Vite doesn't serve Vercel-style /api routes. In dev, run `vercel dev` (default :3000)
      // and proxy these calls so buttons like "Sync Now" work locally.
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  css: {
    // Disable Lightning CSS to avoid optimizer warnings like
    // "Unknown at rule: @property" coming from some UI libs (e.g., radial-progress)
    lightningcss: false,
    // Use the PostCSS pipeline
    transformer: 'postcss',
  },
  build: {
    // Use esbuild for CSS minification to avoid warnings from Lightning CSS
    // like "Unknown at rule: @property" coming from certain UI libraries.
    cssMinify: 'esbuild',
  // The Analytics/Recharts chunk is lazily loaded and consistently sits just above
  // Vite's default 500 kB warning threshold. Raising the limit keeps the build
    // output noise-free while the bulk of the app still ships much smaller chunks.
    chunkSizeWarningLimit: 700,
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
        name: "Venky's Admin",
        short_name: 'VenkyAdmin',
        description: 'Admin dashboard and POS for Venky\'s',
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
      injectRegister: null,
      devOptions: { enabled: true },
    }),
  ],
})
