/** @type {import('tailwindcss').Config} */

// TechElevateGH theme — Ghana flag palette: red, gold, green, black.
// All Tailwind color families are remapped onto these so the whole app stays
// strictly on-palette: greens/blues -> Ghana green, ambers/oranges -> gold,
// reds/roses -> Ghana red. Neutral grays (slate/gray/etc.) remain for structure.
const green = {
  50: '#e9f5ee',
  100: '#cfe9da',
  200: '#a6d7ba',
  300: '#6cbd8c',
  400: '#34a163',
  500: '#138a46',
  600: '#0e7a3d',
  700: '#0b6233',
  800: '#0a4f2a',
  900: '#083f22',
  950: '#042916',
};
const gold = {
  50: '#fdf6e3',
  100: '#faecc2',
  200: '#f4d985',
  300: '#edc24a',
  400: '#e0a100',
  500: '#c4880a',
  600: '#a87400',
  700: '#855a00',
  800: '#6b4900',
  900: '#573c00',
  950: '#3a2700',
};
const red = {
  50: '#fde8ea',
  100: '#fbd0d4',
  200: '#f5a3ab',
  300: '#ee6b78',
  400: '#e23b4d',
  500: '#ce1126',
  600: '#b40e21',
  700: '#900b1a',
  800: '#760a16',
  900: '#620913',
  950: '#3a0309',
};

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
        // On-palette named scales
        green,
        gold,
        red,
        // Brand + cool families -> Ghana green
        brand: green,
        blue: green,
        sky: green,
        cyan: green,
        indigo: green,
        violet: green,
        purple: green,
        fuchsia: green,
        teal: green,
        emerald: green,
        lime: green,
        // Warm families -> gold
        amber: gold,
        yellow: gold,
        orange: gold,
        // Red family -> Ghana red
        rose: red,
        pink: red,
        // Backwards-compatible aliases
        'te-blue': green[600],
        'te-cyan': green[500],
        'te-purple': green[700],
        'te-green': green[600],
        'te-gold': gold[500],
        'te-red': red[500],
        'te-dark-bg': '#14130f',
        'te-dark-surface': '#1c1a15',
        'te-dark-border': '#2e2b23',
        'te-dark-hover': '#26241d'
      },
      backgroundImage: {
        // Ghana tricolor
        'te-gradient': 'linear-gradient(90deg, #0e7a3d 0%, #c4880a 50%, #ce1126 100%)',
        'te-gradient-diag': 'linear-gradient(135deg, #0e7a3d 0%, #c4880a 50%, #ce1126 100%)',
        'brand-gradient': 'linear-gradient(135deg, #0e7a3d 0%, #138a46 100%)'
      },
      boxShadow: {
        'te': '0 1px 2px 0 rgba(20,18,12,0.05), 0 1px 3px 0 rgba(20,18,12,0.06)',
        'te-dark': '0 1px 2px 0 rgba(0,0,0,0.4), 0 1px 3px 0 rgba(0,0,0,0.5)',
        'te-card': '0 1px 2px 0 rgba(20,18,12,0.04), 0 1px 2px 0 rgba(20,18,12,0.04)',
        'te-card-hover': '0 1px 2px 0 rgba(20,18,12,0.06), 0 6px 16px -8px rgba(20,18,12,0.12)',
        'brand-glow': '0 1px 2px 0 rgba(14,122,61,0.10), 0 8px 24px -12px rgba(14,122,61,0.35)'
      },
      borderRadius: {
        'xl2': '0.875rem'
      }
    }
  },
  plugins: [require('@tailwindcss/forms')],
}
