/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

const scale = (name) =>
  Object.fromEntries([50, 100, 200, 500, 600, 700, 800, 900].map((s) => [s, v(`${name}-${s}`)]));

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: v('canvas'),
        ink: {
          DEFAULT: v('ink'),
          primary: v('ink'),
          muted: v('ink-muted'),
          subtle: v('ink-subtle'),
        },
        // Accent for text, borders and tints; lightens in dark mode
        evergreen: {
          light: v('evergreen-light'),
          DEFAULT: v('evergreen'),
          dark: v('evergreen-dark'),
        },
        // Solid fills that carry white text; stay dark enough in both themes
        brand: {
          DEFAULT: v('brand'),
          dark: v('brand-dark'),
        },
        danger: v('danger'),
        info: v('info'),
        used: v('used'),
        lime: {
          DEFAULT: v('lime'),
          subtle: v('lime-subtle'),
        },
        surface: {
          DEFAULT: v('surface'),
          secondary: v('surface-secondary'),
          border: v('surface-border'),
        },
        emerald: scale('emerald'),
        amber: scale('amber'),
        rose: scale('rose'),
        red: scale('red'),
        blue: scale('blue'),
        purple: scale('purple'),
        slate: scale('slate'),
        orange: scale('orange'),
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
