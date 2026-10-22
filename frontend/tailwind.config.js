/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        usf: {
          green: '#006747',
          dark: '#004c34',
          light: '#e6f4ef',
          gold: '#cfc493',
          goldDark: '#998647',
          goldLight: '#faf6ea',
          accent: '#f8c146',
        }
      }
    },
  },
  plugins: [],
}
