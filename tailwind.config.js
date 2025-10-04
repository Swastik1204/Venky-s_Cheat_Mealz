import daisyui from 'daisyui'

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        venkys_light: {
          primary: '#f59e0b',
          'primary-content': '#1f1400',
            
          secondary: '#ef4444',
          'secondary-content': '#ffffff',

          accent: '#f59e0b',
          'accent-content': '#1f1400',

          neutral: '#1f2937',
          'neutral-content': '#f3f4f6',

          'base-100': '#ffffff',
          'base-200': '#f5f5f5',
          'base-300': '#e5e7eb',
          'base-content': '#111827',

          info: '#f59e0b',
          'info-content': '#1f1400',
          success: '#16a34a',
          'success-content': '#ffffff',
          warning: '#f59e0b',
          'warning-content': '#1f1400',
          error: '#ef4444',
          'error-content': '#ffffff',
        },
      },
      {
        venkys_dark: {
          primary: '#fbbf24', // slightly lighter yellow for dark bg contrast
          'primary-content': '#1f1400',

          secondary: '#f87171',
          'secondary-content': '#1f1400',

          accent: '#f59e0b',
          'accent-content': '#1f1400',

          neutral: '#111827',
          'neutral-content': '#f3f4f6',

          'base-100': '#1e1e21',
          'base-200': '#232327',
          'base-300': '#2c2c31',
          'base-content': '#f3f4f6',

          info: '#f59e0b',
          'info-content': '#1f1400',
          success: '#22c55e',
          'success-content': '#062b12',
          warning: '#f59e0b',
          'warning-content': '#1f1400',
          error: '#ef4444',
          'error-content': '#2b0a0a',
        },
      },
    ],
    base: true,
    styled: true,
    utils: true,
    logs: false,
    themeRoot: ':root',
  },
}
