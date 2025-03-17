import tailwindcss_primeui from "tailwindcss-primeui";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[class*="app-dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue,css}",
  ],
  theme: {
    extend: {}
  },
  plugins: [tailwindcss_primeui],
}

