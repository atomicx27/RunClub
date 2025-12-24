/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        game: {
          dark: '#0f172a',
          primary: '#3b82f6',
          accent: '#10b981',
          danger: '#ef4444',
          surface: '#1e293b',
        }
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'], // For game UI
        inter: ['Inter', 'sans-serif'], // For body text
      }
    },
  },
  plugins: [],
}
