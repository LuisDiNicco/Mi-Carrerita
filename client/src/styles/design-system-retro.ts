// client/src/styles/design-system-retro.ts
// 🎮 Sistema de Diseño Retro/8-bits para Mi Carrerita

export const retroTheme = {
  // Colores inspirados en consolas retro (NES, Game Boy, etc)
  colors: {
    // Paleta principal estilo NES
    primary: {
      bg: '#0F380F',        // Verde oscuro Game Boy
      text: '#9BBC0F',      // Verde claro Game Boy
      accent: '#8BAC0F',    // Verde medio
      shadow: '#306230',    // Verde sombra
    },
    
    // Estados de materias con paleta retro
    subject: {
      locked: {
        bg: '#4A4A4A',
        border: '#2A2A2A', 
        text: '#888888',
      },
      available: {
        bg: '#FCE94F',      // Amarillo NES
        border: '#C4A000',
        text: '#2E3436',
      },
      inProgress: {
        bg: '#729FCF',      // Azul retro
        border: '#3465A4',
        text: '#FFFFFF',
      },
      regularized: {
        bg: '#8AE234',      // Verde lima
        border: '#4E9A06',
        text: '#2E3436',
      },
      approved: {
        bg: '#73D216',      // Verde éxito
        border: '#4E9A06',
        text: '#FFFFFF',
      }
    },

    // UI elements
    ui: {
      screen: '#0F380F',
      screenGlow: 'rgba(155, 188, 15, 0.1)',
      pixel: '#9BBC0F',
      pixelDark: '#306230',
      shadow: 'rgba(0, 0, 0, 0.8)',
    }
  },

  // Tipografía retro
  fonts: {
    pixel: '"VT323", "Courier New", monospace',
    body: '"Press Start 2P", "VT323", monospace', // Agregar Press Start 2P
    display: '"VT323", monospace',
  },

  // Espaciado en múltiplos de 8 (pixel-perfect)
  spacing: {
    xs: '4px',   // 0.5 unit
    sm: '8px',   // 1 unit
    md: '16px',  // 2 units
    lg: '24px',  // 3 units
    xl: '32px',  // 4 units
    '2xl': '48px', // 6 units
  },

  // Bordes estilo pixelado
  borders: {
    pixel: '3px solid currentColor',
    pixelThick: '4px solid currentColor',
    pixelDotted: '3px dotted currentColor',
  },

  // Sombras estilo retro (offset pronunciado)
  shadows: {
    pixel: '4px 4px 0px rgba(0, 0, 0, 0.8)',
    pixelHover: '2px 2px 0px rgba(0, 0, 0, 0.8)',
    pixelInset: 'inset 3px 3px 0px rgba(0, 0, 0, 0.3)',
    glow: '0 0 10px rgba(155, 188, 15, 0.5)',
  },

  // Animaciones retro
  animations: {
    blink: 'blink 1s step-end infinite',
    glitch: 'glitch 2s infinite',
    scan: 'scan 8s linear infinite',
    pixel: 'pixelate 0.3s steps(4)',
  },

  // Patrones de fondo
  patterns: {
    // Grid estilo CRT
    scanlines: `
      repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.15),
        rgba(0, 0, 0, 0.15) 1px,
        transparent 1px,
        transparent 2px
      )
    `,
    // Puntos estilo Game Boy
    dots: `
      radial-gradient(circle, #306230 1px, transparent 1px)
    `,
    // Grid de píxeles
    pixelGrid: `
      linear-gradient(90deg, rgba(155, 188, 15, 0.05) 1px, transparent 1px),
      linear-gradient(rgba(155, 188, 15, 0.05) 1px, transparent 1px)
    `,
  },

  // Efectos especiales
  effects: {
    crtCurve: 'perspective(1000px) rotateX(1deg)',
    screenGlow: 'drop-shadow(0 0 20px rgba(155, 188, 15, 0.3))',
  }
};

// Utilidades CSS-in-JS para componentes
export const retroStyles = {
  // Botón pixelado
  pixelButton: `
    font-family: ${retroTheme.fonts.pixel};
    font-size: 1.25rem;
    padding: ${retroTheme.spacing.md} ${retroTheme.spacing.lg};
    border: ${retroTheme.borders.pixelThick};
    box-shadow: ${retroTheme.shadows.pixel};
    transition: all 0.1s ease;
    cursor: pointer;
    
    &:hover {
      transform: translate(2px, 2px);
      box-shadow: ${retroTheme.shadows.pixelHover};
    }
    
    &:active {
      transform: translate(4px, 4px);
      box-shadow: none;
    }
  `,

  // Contenedor con efecto CRT
  crtContainer: `
    background: ${retroTheme.colors.primary.bg};
    background-image: ${retroTheme.patterns.scanlines};
    border: 8px solid ${retroTheme.colors.primary.shadow};
    border-radius: 16px;
    box-shadow: 
      inset 0 0 50px rgba(0, 0, 0, 0.5),
      0 0 50px rgba(155, 188, 15, 0.2);
  `,

  // Texto con efecto de píxeles
  pixelText: `
    font-family: ${retroTheme.fonts.pixel};
    text-shadow: 
      2px 2px 0 ${retroTheme.colors.primary.shadow},
      -1px -1px 0 ${retroTheme.colors.primary.accent};
    letter-spacing: 2px;
  `,
};

// Keyframes para animaciones
export const retroKeyframes = `
  @keyframes blink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }

  @keyframes glitch {
    0%, 90%, 100% { transform: translate(0); }
    92% { transform: translate(-2px, 2px); }
    94% { transform: translate(2px, -2px); }
    96% { transform: translate(-2px, -2px); }
  }

  @keyframes scan {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }

  @keyframes pixelate {
    0% { filter: blur(2px); }
    100% { filter: blur(0); }
  }

  @keyframes powerOn {
    0% { 
      opacity: 0;
      transform: scale(1, 0.01);
    }
    50% { 
      opacity: 1;
      transform: scale(1, 0.01);
    }
    100% { 
      transform: scale(1, 1);
    }
  }
`;

export default retroTheme;
