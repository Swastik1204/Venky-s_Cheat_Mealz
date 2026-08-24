import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.vercel']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Codebase has many intentionally-unused helpers/locals; keep as warning so `npm run lint` doesn't block deploys.
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
      // Allow empty catch blocks (and other empty blocks) as warnings.
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
  // Node/serverless files
  {
    files: ['api/**/*.js', 'vite.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
])
