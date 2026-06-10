/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  darkMode: 'class',
  content: ["./src/**/*.{js,ts,jsx,tsx,html}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        display: ['JetBrains Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      colors: {
        // Notion-style monochrome scale used as the single accent (black & white theme).
        // `brand` and `blue` are intentionally mapped to the SAME neutral grayscale so
        // that every existing `brand-*` and `blue-*` utility across the app renders as
        // black / white / gray instead of blue.
        brand: {
          50: '#f6f6f5',
          100: '#ededec',
          200: '#e3e3e1',
          300: '#cfcfcd',
          400: '#9e9e9b',
          500: '#71716e',
          600: '#2e2e2e',
          700: '#1f1f1f',
          800: '#171717',
          900: '#0f0f0f',
          950: '#080808',
        },
        // Override Tailwind's default blue palette → neutral grayscale (monochrome theme).
        blue: {
          50: '#f6f6f5',
          100: '#ededec',
          200: '#e3e3e1',
          300: '#cfcfcd',
          400: '#9e9e9b',
          500: '#71716e',
          600: '#2e2e2e',
          700: '#1f1f1f',
          800: '#171717',
          900: '#0f0f0f',
          950: '#080808',
        },
        // Backwards-compatible aliases (kept so existing te-* refs stay cohesive)
        'te-blue': '#1f1f1f',
        'te-cyan': '#2e2e2e',
        'te-purple': '#171717',
        'te-dark-bg': '#191919',      // notion dark page
        'te-dark-surface': '#202020', // notion dark surface
        'te-dark-border': '#2f2f2f',  // notion dark hairline
        'te-dark-hover': '#2a2a2a'
      },
      backgroundImage: {
        'te-gradient': 'linear-gradient(90deg, #1f1f1f 0%, #2e2e2e 50%, #1f1f1f 100%)',
        'te-gradient-diag': 'linear-gradient(135deg, #171717 0%, #1f1f1f 45%, #2e2e2e 90%)',
        'brand-gradient': 'linear-gradient(135deg, #1f1f1f 0%, #2e2e2e 100%)'
      },
      boxShadow: {
        'te': '0 1px 2px 0 rgba(15,15,15,0.05), 0 1px 3px 0 rgba(15,15,15,0.06)',
        'te-dark': '0 1px 2px 0 rgba(0,0,0,0.4), 0 1px 3px 0 rgba(0,0,0,0.5)',
        'te-card': '0 1px 2px 0 rgba(15,15,15,0.04), 0 1px 2px 0 rgba(15,15,15,0.04)',
        'te-card-hover': '0 1px 2px 0 rgba(15,15,15,0.06), 0 6px 16px -8px rgba(15,15,15,0.12)',
        'brand-glow': '0 1px 2px 0 rgba(15,15,15,0.06), 0 8px 24px -12px rgba(15,15,15,0.25)'
      },
      borderRadius: {
        'xl2': '0.875rem'
      }
    }
  },
  plugins: [require('@tailwindcss/forms')],
}
