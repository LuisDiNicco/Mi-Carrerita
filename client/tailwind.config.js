/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        retro: ['"VT323"', 'monospace'],
        sans: ['"Inter"', 'sans-serif'],
      },
      colors: {
        unlam: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          300: '#81C784',
          500: '#006633',
          600: '#2E7D32',
          800: '#1B5E20',
          900: '#0D3311',
        },
        retro: {
          dark: '#1a1a1a',
          light: '#f5f5f5',
          accent: '#00cc66',
        }
      },
      boxShadow: {
        'retro': '4px 4px 0px 0px rgba(0,0,0,1)',
        'retro-hover': '2px 2px 0px 0px rgba(0,0,0,1)',
      }
    },
  },
  plugins: [],
}