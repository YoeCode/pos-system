/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: '#F5F6FA',
        surface: '#FFFFFF',
        primary: '#00C853',
        'primary-dark': '#00A846',
        secondary: '#0091EA',
        'text-primary': '#0A0B0D',
        'text-muted': '#7A8194',
        border: '#E2E5EE',
        error: '#FF5370',
        'dark-bg': '#1C2128',
        'dark-surface': '#252B33',
        'dark-surface-2': '#2D333B',
        'dark-border': '#3D4451',
        'dark-text': '#CDD9E5',
        'dark-muted': '#768390',
      },
      fontFamily: {
        sans: ['Sora', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      borderRadius: {
        '10': '10px',
        '12': '12px',
      },
    },
  },
  plugins: [],
}
