/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: '#F7F7F5',
        surface: '#FFFFFF',
        'surface-subtle': '#F0F0EC',
        text: {
          primary: '#111111',
          secondary: '#666666',
          muted: '#8E8E8A'
        },
        border: {
          DEFAULT: '#E2E2DE',
          subtle: '#EDEDEA'
        },
        action: {
          primary: '#0A0A0A',
          hover: '#262626'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
