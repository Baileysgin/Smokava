/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Orange-red accent colors (from logo mouthpiece/top)
        accent: {
          50: '#fff5f2',
          100: '#ffe8e0',
          200: '#ffd5c8',
          300: '#ffb8a3',
          400: '#ff9266',
          500: '#ff7b47',
          600: '#ff6b35',
          700: '#ff5722',
          800: '#e64a19',
          900: '#bf360c',
          DEFAULT: '#ff6b35',
        },
        // Deep purple base colors (from logo base)
        purple: {
          50: '#f3e8ff',
          100: '#e1bee7',
          200: '#ce93d8',
          300: '#ba68c8',
          400: '#ab47bc',
          500: '#9c27b0',
          600: '#8e24aa',
          700: '#7b1fa2',
          800: '#6a1b9a',
          900: '#4a148c',
          dark: '#2d1b4e',
          darker: '#1a0d2e',
        },
        // Dark backgrounds and text
        dark: {
          50: '#f5f5f0',
          100: '#2d2d2d',
          200: '#1a1a1a',
          300: '#0f0f0f',
          400: '#000000',
        },
        'dark-grey': '#2d2d2d',
        'off-white': '#f5f5f0',
        charcoal: {
          DEFAULT: '#2d2d2d',
          dark: '#1a1a1a',
        },
        // Legacy gold support (keeping for backward compatibility)
        gold: {
          500: '#ff6b35',
          600: '#ff7b47',
        },
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Shabnam', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
