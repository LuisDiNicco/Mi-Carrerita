export const retroTheme = {
  colors: {
    primary: {
      bg: "#0F380F",
      text: "#9BBC0F",
      accent: "#8BAC0F",
      shadow: "#306230",
    },
    subject: {
      locked: {
        bg: "#4A4A4A",
        border: "#2A2A2A",
        text: "#888888",
      },
      available: {
        bg: "#FCE94F",
        border: "#C4A000",
        text: "#2E3436",
      },
      inProgress: {
        bg: "#729FCF",
        border: "#3465A4",
        text: "#FFFFFF",
      },
      regularized: {
        bg: "#8AE234",
        border: "#4E9A06",
        text: "#2E3436",
      },
      approved: {
        bg: "#73D216",
        border: "#4E9A06",
        text: "#FFFFFF",
      },
    },
    ui: {
      screen: "#0F380F",
      screenGlow: "rgba(155, 188, 15, 0.1)",
      pixel: "#9BBC0F",
      pixelDark: "#306230",
      shadow: "rgba(0, 0, 0, 0.8)",
    },
  },
  fonts: {
    pixel: '"VT323", "Courier New", monospace',
    body: '"Press Start 2P", "VT323", monospace',
    display: '"VT323", monospace',
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    "2xl": "48px",
  },
  borders: {
    pixel: "3px solid currentColor",
    pixelThick: "4px solid currentColor",
    pixelDotted: "3px dotted currentColor",
  },
  shadows: {
    pixel: "4px 4px 0px rgba(0, 0, 0, 0.8)",
    pixelHover: "2px 2px 0px rgba(0, 0, 0, 0.8)",
    pixelInset: "inset 3px 3px 0px rgba(0, 0, 0, 0.3)",
    glow: "0 0 10px rgba(155, 188, 15, 0.5)",
  },
  animations: {
    blink: "blink 1s step-end infinite",
    glitch: "glitch 2s infinite",
    scan: "scan 8s linear infinite",
    pixel: "pixelate 0.3s steps(4)",
  },
  patterns: {
    scanlines: `
      repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.15),
        rgba(0, 0, 0, 0.15) 1px,
        transparent 1px,
        transparent 2px
      )
    `,
    dots: `
      radial-gradient(circle, #306230 1px, transparent 1px)
    `,
    pixelGrid: `
      linear-gradient(90deg, rgba(155, 188, 15, 0.05) 1px, transparent 1px),
      linear-gradient(rgba(155, 188, 15, 0.05) 1px, transparent 1px)
    `,
  },
  effects: {
    crtCurve: "perspective(1000px) rotateX(1deg)",
    screenGlow: "drop-shadow(0 0 20px rgba(155, 188, 15, 0.3))",
  },
};

export const retroStyles = {
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
  crtContainer: `
    background: ${retroTheme.colors.primary.bg};
    background-image: ${retroTheme.patterns.scanlines};
    border: 8px solid ${retroTheme.colors.primary.shadow};
    border-radius: 16px;
    box-shadow:
      inset 0 0 50px rgba(0, 0, 0, 0.5),
      0 0 50px rgba(155, 188, 15, 0.2);
  `,
  pixelText: `
    font-family: ${retroTheme.fonts.pixel};
    text-shadow:
      2px 2px 0 ${retroTheme.colors.primary.shadow},
      -1px -1px 0 ${retroTheme.colors.primary.accent};
    letter-spacing: 2px;
  `,
};

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
