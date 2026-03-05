import { SubjectStatus } from '../shared/types/academic';

/**
 * ========================================
 * NODE TOKENS & SIZES
 * ========================================
 */
export const NODE_LAYOUT = {
    WIDTH_PX: 280,
    SUBJECT_NAME_MAX: 48,
};

export const NODE_TYPOGRAPHY = {
    TITLE_CLASS: 'text-xl leading-tight',
    META_CLASS: 'text-lg',
    BADGE_CLASS: 'text-base',
};

// Node Hover/Unlock rings
export const NODE_EFFECTS = {
    HOVERED_NODE: 'ring-4 ring-white/80 scale-105 z-50 shadow-lg',
    PREREQUISITE: '!ring-4 !ring-orange-400/90 opacity-100',
    FULL_UNLOCK: '!ring-4 !ring-green-400/90 opacity-100',
    PARTIAL_UNLOCK: '!ring-4 !ring-yellow-300/90 opacity-90',
};

/**
 * ========================================
 * SHARED RETRO UI COLORS (Buttons, Badges)
 * ========================================
 */
export const RETRO_UI_VARIANTS = {
    primary: {
        base: 'bg-unlam-500 border-unlam-800 text-[#0B2A14]',
        hover: 'hover:bg-unlam-600'
    },
    success: {
        base: 'bg-[#73D216] border-[#4E9A06] text-white',
        hover: 'hover:bg-[#5FB300]'
    },
    danger: {
        base: 'bg-[#EF2929] border-[#CC0000] text-white',
        hover: 'hover:bg-[#D41919]'
    },
    warning: {
        base: 'bg-[#FCE94F] border-[#C4A000] text-[#2E3436]',
        hover: 'hover:bg-[#EDD400]'
    },
    info: {
        base: 'bg-[#729FCF] border-[#3465A4] text-white',
        hover: ''
    },
};

/**
 * ========================================
 * SUBJECT STATUS STYLES (Cards and Nodes)
 * ========================================
 */
export const STATUS_UI_STYLES: Record<SubjectStatus, {
    container: string;
    badge: string;
    border: string;
}> = {
    [SubjectStatus.EQUIVALENCIA]: {
        container: 'bg-[#B084CC] text-[#291736]',
        badge: 'bg-[#8F66A8] border-[#6D4284] text-white',
        border: 'border-[#6D4284]',
    },
    [SubjectStatus.PENDIENTE]: {
        container: 'bg-[#353C35] text-[#C5D2C5]',
        badge: 'bg-[#3E4A3E] border-[#2A342A] text-[#E8F2E8]',
        border: 'border-[#2A342A]',
    },
    [SubjectStatus.DISPONIBLE]: {
        container: 'bg-[#F7E8A3] text-[#2E3436]',
        badge: 'bg-[#E4C96A] border-[#C4A85B] text-[#2E3436]',
        border: 'border-[#C4A85B]',
    },
    [SubjectStatus.EN_CURSO]: {
        container: 'bg-[#8FB5DD] text-[#1C2B3A]',
        badge: 'bg-[#5F89BF] border-[#3F6FA2] text-white',
        border: 'border-[#3F6FA2]',
    },
    [SubjectStatus.REGULARIZADA]: {
        container: 'bg-[#B4E6A6] text-[#1F2A1F]',
        badge: 'bg-[#6BBE6E] border-[#4F9C52] text-white',
        border: 'border-[#4F9C52]',
    },
    [SubjectStatus.APROBADA]: {
        container: 'bg-[#7BCB7A] text-[#0B2A14] font-bold',
        badge: 'bg-[#4FAE59] border-[#2E7D4D] text-[#0B2A14]',
        border: 'border-[#2E7D4D]',
    },
    [SubjectStatus.RECURSADA]: {
        container: 'bg-[#E57373] text-[#2C0B0E]',
        badge: 'bg-[#EF5350] border-[#B71C1C] text-[#2C0B0E]',
        border: 'border-[#B71C1C]',
    },
};

/**
 * ========================================
 * TOOLTIP SYTLES
 * ========================================
 */
export const TOOLTIP_STYLES = {
    BACKGROUND: 'bg-[#1C2B1F]',
    TEXT: 'text-white',
    BORDER: 'border-app',
};
