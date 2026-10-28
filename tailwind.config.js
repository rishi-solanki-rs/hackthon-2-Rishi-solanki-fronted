/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F9F8',
        ink: {
          DEFAULT: '#17231F',
          primary: '#17231F',
          muted: '#5C6B64',
          subtle: '#8C9B94',
        },
        evergreen: {
          light: '#E8F3EE',
          DEFAULT: '#176B54',
          dark: '#0F4737',
        },
        lime: {
          DEFAULT: '#D7F36A',
          subtle: '#F4FCE3',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F0F4F2',
          border: '#E5EBE8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

