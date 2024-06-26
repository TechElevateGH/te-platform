/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: ["./src/**/*.{js,ts,jsx,tsx,html}",],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/forms'),],
}
