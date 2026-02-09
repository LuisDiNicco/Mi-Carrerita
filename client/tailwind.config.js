/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Fuentes retro
      fontFamily: {
        retro: ['"VT323"', 'monospace'],
        pixel: ['"Press Start 2P"', 'monospace'],  // Agregar via Google Fonts
        sans: ['"Inter"', 'sans-serif'],
      },

      // Paleta de colores retro completa
      colors: {
        // Colores UNLAM originales
        unlam: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          300: '#81C784',
          500: '#006633',
          600: '#2E7D32',
          800: '#1B5E20',
          900: '#0D3311',
        },

        // Colores retro/8-bits
        retro: {
          dark: '#0F380F',        // Verde oscuro Game Boy
          light: '#9BBC0F',       // Verde claro Game Boy
          accent: '#8BAC0F',      // Verde medio
          shadow: '#306230',      // Verde sombra
          
          // Paleta NES
          red: '#EF2929',
          orange: '#F57900',
          yellow: '#FCE94F',
          green: '#73D216',
          blue: '#729FCF',
          purple: '#AD7FA8',
          pink: '#F9A7B0',
        },

        // Estados de materias (más vibrantes)
        subject: {
          locked: '#4A4A4A',
          available: '#FCE94F',
          progress: '#729FCF',
          regular: '#8AE234',
          approved: '#73D216',
        }
      },

      // Sombras estilo pixel art
      boxShadow: {
        'retro': '4px 4px 0px 0px rgba(0, 0, 0, 0.8)',
        'retro-hover': '2px 2px 0px 0px rgba(0, 0, 0, 0.8)',
        'retro-inset': 'inset 3px 3px 0px 0px rgba(0, 0, 0, 0.3)',
        'glow': '0 0 20px rgba(155, 188, 15, 0.5)',
        'glow-strong': '0 0 30px rgba(155, 188, 15, 0.8)',
      },

      // Animaciones personalizadas
      animation: {
        'blink': 'blink 1s step-end infinite',
        'glitch': 'glitch 2s infinite',
        'scan': 'scan 8s linear infinite',
        'pixel-fade': 'pixelFade 0.3s steps(4)',
        'float': 'float 3s ease-in-out infinite',
        'power-on': 'powerOn 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },

      // Keyframes
      keyframes: {
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        glitch: {
          '0%, 90%, 100%': { transform: 'translate(0)' },
          '92%': { transform: 'translate(-2px, 2px)' },
          '94%': { transform: 'translate(2px, -2px)' },
          '96%': { transform: 'translate(-2px, -2px)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        pixelFade: {
          '0%': { filter: 'blur(2px)', opacity: '0' },
          '100%': { filter: 'blur(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        powerOn: {
          '0%': { 
            opacity: '0',
            transform: 'scale(1, 0.01)',
          },
          '50%': { 
            opacity: '1',
            transform: 'scale(1, 0.01)',
          },
          '100%': { 
            transform: 'scale(1, 1)',
          },
        },
      },

      // Tamaños personalizados
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },

      // Bordes redondeados pixelados (más cuadrados)
      borderRadius: {
        'pixel': '2px',
        'pixel-lg': '4px',
      },

      // Anchos personalizados
      width: {
        'node': '14rem',  // 224px
      },

      // Backgrounds con patrones
      backgroundImage: {
        'scanlines': `repeating-linear-gradient(
          0deg,
          rgba(0, 0, 0, 0.15),
          rgba(0, 0, 0, 0.15) 1px,
          transparent 1px,
          transparent 2px
        )`,
        'dots': `radial-gradient(circle, #306230 1px, transparent 1px)`,
        'grid': `
          linear-gradient(90deg, rgba(155, 188, 15, 0.05) 1px, transparent 1px),
          linear-gradient(rgba(155, 188, 15, 0.05) 1px, transparent 1px)
        `,
      },

      // Tamaños de fondo
      backgroundSize: {
        'dots': '8px 8px',
        'grid': '20px 20px',
      },
    },
  },
  plugins: [
    // Plugin personalizado para image-rendering pixelated
    function({ addUtilities }) {
      addUtilities({
        '.image-rendering-pixelated': {
          'image-rendering': 'pixelated',
          'image-rendering': '-moz-crisp-edges',
          'image-rendering': 'crisp-edges',
        },
        '.text-shadow-retro': {
          'text-shadow': '2px 2px 0 rgba(0, 0, 0, 0.5)',
        },
        '.text-shadow-retro-strong': {
          'text-shadow': '3px 3px 0 rgba(0, 0, 0, 0.8)',
        },
      })
    },
  ],
}