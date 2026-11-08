/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        main: '#090B10',
        sidebar: '#0D1017',
        card: '#11151E',
        elevated: '#171C27',
        border: '#242B38',
        primary: {
          DEFAULT: '#8B7CFF',
          hover: '#7A6AE6',
          muted: 'rgba(139, 124, 255, 0.14)',
        },
        text: {
          primary: '#F4F6FA',
          secondary: '#929BAC',
          muted: '#657084',
        },
        status: {
          success: '#22C58B',
          warning: '#F5B942',
          error: '#F06464',
          info: '#55A6FF',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        md: '8px',
        lg: '10px',
        xl: '12px',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        elevated: '0 8px 24px -4px rgba(0, 0, 0, 0.55), 0 2px 6px -1px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
}

