/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  darkMode: 'class',
  content: ["./src/**/*.{js,ts,jsx,tsx,html}"],
  theme: {
    extend: {
      colors: {
        'te-blue': '#2563eb',      // base blue
        'te-cyan': '#06b6d4',      // cyan accent
        'te-purple': '#7c3aed',    // purple accent
        'te-dark-bg': '#0f172a',   // slate-900 variant
        'te-dark-surface': '#1e293b',
        'te-dark-border': '#334155',
        'te-dark-hover': '#24344d'
      },
      backgroundImage: {
        'te-gradient': 'linear-gradient(90deg, #2563eb 0%, #06b6d4 50%, #7c3aed 100%)',
        'te-gradient-diag': 'linear-gradient(135deg, #2563eb 0%, #06b6d4 45%, #7c3aed 90%)'
      },
      boxShadow: {
        'te': '0 4px 24px -4px rgba(37,99,235,0.25)',
        'te-dark': '0 4px 24px -4px rgba(124,58,237,0.25)'
      }
    }
  },
  plugins: [require('@tailwindcss/forms')],
}
