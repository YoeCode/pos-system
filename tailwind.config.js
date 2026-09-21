/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Stitch Nexora palette
        background: '#F6F8FB',
        surface: '#FFFFFF',
        primary: '#0F766E',
        'primary-dark': '#115E59',
        'primary-container': '#0F766E',
        secondary: '#14213D',
        'text-primary': '#172033',
        'text-muted': '#64748B',
        border: '#DDE3EA',
        success: '#15803D',
        warning: '#D97706',
        info: '#2563EB',
        error: '#DC2626',
        // Stitch surface system
        'surface-dim': '#CBDBF5',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#EFF4FF',
        'surface-container': '#E5EEFF',
        'surface-container-high': '#DCE9FF',
        'surface-container-highest': '#D3E4FE',
        'surface-variant': '#D3E4FE',
        // Stitch text hierarchy
        'on-surface': '#0B1C30',
        'on-surface-variant': '#3E4947',
        'inverse-surface': '#213145',
        'inverse-on-surface': '#EAF1FF',
        outline: '#6E7977',
        'outline-variant': '#BDC9C6',
        // Stitch semantic containers
        'error-container': '#FFDAD6',
        'on-error-container': '#93000A',
        'success-light': '#DCFCE7',
        'warning-light': '#FEF3C7',
        'info-light': '#DBEAFE',
        // Legacy dark mode (conservado)
        'dark-bg': '#1C2128',
        'dark-surface': '#252B33',
        'dark-surface-2': '#2D333B',
        'dark-border': '#3D4451',
        'dark-text': '#CDD9E5',
        'dark-muted': '#768390',
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      fontSize: {
        'display-lg': ['36px', { lineHeight: '44px', fontWeight: '700' }],
        'headline-lg': ['28px', { lineHeight: '36px', fontWeight: '600' }],
        'headline-md': ['22px', { lineHeight: '28px', fontWeight: '600' }],
        'headline-sm': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'label-lg': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'label-md': ['13px', { lineHeight: '18px', fontWeight: '500' }],
        'label-sm': ['11px', { lineHeight: '14px', fontWeight: '600' }],
        'numeric-pos': ['24px', { lineHeight: '32px', fontWeight: '700' }],
      },
      borderRadius: {
        '10': '10px',
        '12': '12px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(20,33,61,0.04), 0 1px 2px -1px rgba(20,33,61,0.03)',
        'card-hover': '0 4px 6px -1px rgba(20,33,61,0.07), 0 2px 4px -2px rgba(20,33,61,0.05)',
        'modal': '0 20px 25px -5px rgba(20,33,61,0.1), 0 8px 10px -6px rgba(20,33,61,0.06)',
      },
      spacing: {
        'gutter': '1rem',
        'gutter-compact': '0.5rem',
      },
    },
  },
  plugins: [],
}
