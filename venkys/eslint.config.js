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
    },
  },
  // Node/serverless files
  {
    files: ['api/**/*.js', 'scripts/**/*.js', 'vite.config.js', 'firebase*.js', 'tailwind.config.js'],
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
  // Money is integer paise; ONLY money.js converts or does percentage math (pct, fromFraction, ratioPct, growthPct,
  // toDisplay, fromRupeeInput). The rule bans a raw `* 100` / `/ 100` (a) in any file that imports money.js and (b) by
  // path in the files that handle money fields, so a money file cannot dodge it by not importing money.js. Non-money
  // `* 100` (km rounding, progress bars, unit scaling) is left alone. Existing violations awaiting this app's paise
  // conversion carry a per-line `eslint-disable-next-line no-restricted-syntax -- money conversion pending` so any NEW one fails.
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['**/money.js', '**/__tests__/money.test.mjs'],
    rules: {
      'no-restricted-syntax': ['error', {
        selector: 'Program:has(ImportDeclaration[source.value=/money(\\.js)?$/]) BinaryExpression:matches([operator="*"], [operator="/"]):matches([left.value=100], [right.value=100])',
        message: 'Money maths goes through money.js (pct, fromFraction, ratioPct, growthPct, toDisplay, fromRupeeInput), never a raw * 100 or / 100.',
      }],
    },
  },
  {
    files: [
      'api/create-order.js',
      'api/razorpay-webhook.js',
      'api/verify-payment.js',
      'api/place-order.js',
      'api/notify-order.js',
      'src/lib/data-cart.js',
      'src/lib/data-menu.js',
      'src/lib/data-orders.js',
      'src/lib/data-payments.js',
      'src/lib/formatCurrency.js',
      'src/pages/Checkout.jsx',
      'src/pages/Home.jsx',
      'src/pages/Profile.jsx',
      'src/pages/ActiveOrders.jsx',
      'src/components/ItemModal.jsx',
      'src/components/MenuItemCard.jsx',
    ],
    ignores: ['**/money.js'],
    rules: {
      'no-restricted-syntax': ['error', {
        selector: 'BinaryExpression:matches([operator="*"], [operator="/"]):matches([left.value=100], [right.value=100])',
        message: 'This file handles money: do rupee/paise and percentage math only through money.js, never a raw * 100 or / 100.',
      }],
    },
  },
])
