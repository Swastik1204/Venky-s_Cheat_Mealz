/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {},
  },
  daisyui: {
    themes: [
      {
        venkys: {
          primary: '#f59e0b', // yellow
          secondary: '#ef4444', // red
          accent: '#f59e0b', // align accent with yellow
          neutral: '#1f2937',
          'base-100': '#ffffff',
          info: '#f59e0b',
          success: '#f59e0b',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
      'light',
      'dark',
    ],
    base: true,
    styled: true,
    utils: true,
    logs: false,
    themeRoot: ':root',
  },
}
