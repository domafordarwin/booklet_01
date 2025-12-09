/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
         sans: ['Lato', 'sans-serif'],
         serif: ['Merriweather', 'serif'],
      }
    },
  },
  plugins: [],
}