/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'card-bg-light': '#ffffff',
        'card-bg-dark': '#262730',
        'bg-light': '#f8f9fa',
        'bg-dark': '#0e1117',
        'text-light': '#2c3e50',
        'text-dark': '#fafafa',
        'border-light': '#e9ecef',
        'border-dark': '#4b4b4b',
      }
    },
  },
  plugins: [],
}
