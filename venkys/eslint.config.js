import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
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
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  // Node/serverless files
  {
    files: ['api/**/*.js', 'vite.config.js', 'firebase*.js', 'tailwind.config.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      // Allow small utility exports without triggering React Fast Refresh rule
      'react-refresh/only-export-components': 'off',
      // Allow intentionally empty blocks (we still encourage adding a comment)
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
  // Non-component utility code inside src should not be constrained by react-refresh rule
  {
    files: ['src/lib/**/*.js', 'src/services/**/*.js', 'src/context/**/*.jsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
])
