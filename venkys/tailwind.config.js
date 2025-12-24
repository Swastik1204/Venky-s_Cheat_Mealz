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

          accent: '#38bdf8',
          'accent-content': '#04121c',

          neutral: '#1f2937',
          'neutral-content': '#f9fafb',

          'base-100': '#ffffff',
          'base-200': '#f4f4f5',
          'base-300': '#e4e4e7',
          'base-content': '#111827',

          info: '#38bdf8',
          'info-content': '#04121c',
          success: '#22c55e',
          'success-content': '#062b12',
          warning: '#facc15',
          'warning-content': '#231500',
          error: '#f87171',
          'error-content': '#2b0a0a',
        },
      },
      {
        venkys_dark: {
          primary: '#fbbf24',
          'primary-content': '#1f1400',

          secondary: '#f87171',
          'secondary-content': '#1f1400',

          accent: '#38bdf8',
          'accent-content': '#04121c',

          neutral: '#0f172a',
          'neutral-content': '#f8fafc',

          'base-100': '#0d1117',
          'base-200': '#111827',
          'base-300': '#1f2937',
          'base-content': '#f9fafb',

          info: '#38bdf8',
          'info-content': '#04121c',
          success: '#22c55e',
          'success-content': '#052913',
          warning: '#fbbf24',
          'warning-content': '#1f1400',
          error: '#f87171',
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
