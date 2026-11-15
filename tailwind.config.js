/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0B1F3A', 800: '#0B1F3A', 900: '#07152A' },
        royal: { DEFAULT: '#1D4ED8', 600: '#1D4ED8', 700: '#1E40AF' },
        cyanblue: { DEFAULT: '#0EA5E9', 500: '#0EA5E9' }
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
    }
  },
  plugins: []
}
