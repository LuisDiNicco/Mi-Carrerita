export const EDGE_STYLES = {
  normal: {
    stroke: "#5BBE63",
    strokeWidth: 2,
  },
  blocked: {
    stroke: "#8A9B8A",
    strokeWidth: 2,
  },
  critical: {
    stroke: "#E85D5D",
    strokeWidth: 4,
  },
};

export const EDGE_MARKER = {
  width: 18,
  height: 18,
};

export const BACKGROUND_CONFIG = {
  color: "#7BCB7A",
  gap: 28,
  size: 2,
  opacity: 0.3,
  miniMapMask: "rgba(10, 20, 12, 0.65)",
};

export const VIEWPORT_CONFIG = {
  minZoom: 0.1,
  maxZoom: 1.5,
  defaultZoom: 0.8,
  fitPadding: 0.2,
};

export const UI_LABELS = {
  fullscreenOn: "Pantalla completa",
  fullscreenOff: "Salir de pantalla completa",
  criticalOn: "Ocultar camino critico",
  criticalOff: "Ver camino critico",
};

export const UPDATE_FLASH_MS = 1400;
export const SEARCH_MIN_CHARS = 1;
export const SEARCH_ZOOM = 1.2;
export const FOCUS_TIMEOUT_MS = 2000;
export const SEARCH_PANEL_WIDTH_PX = 320;
export const SEARCH_LIST_MAX_HEIGHT_PX = 220;
