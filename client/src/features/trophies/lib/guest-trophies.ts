/**
 * Guest Trophy System
 * Mirrors the backend TROPHY_DEFINITIONS and evaluator logic in pure TypeScript
 * so that guest users can see and track trophies calculated from their local
 * subject store — no API calls required.
 */

import type { Subject } from '../../../shared/types/academic';
import { SubjectStatus } from '../../../shared/types/academic';
import type { TrophyDto, TrophyCaseDto, TrophyTier } from './trophies-api';

// ─── Static Definitions (mirrors server/helpers/trophy-definitions.ts) ─────────

interface GuestTrophyDef {
    code: string;
    name: string;
    description: string;
    tier: TrophyTier;
    rarity: number;
}

const TIER_ICONS: Record<TrophyTier, string> = {
    BRONZE: '/bronze-trophie.png',
    SILVER: '/silver-trophie.png',
    GOLD: '/gold-trophie.png',
    PLATINUM: '/platinum-trophie.png',
};

export const GUEST_TROPHY_DEFS: GuestTrophyDef[] = [
    // ─── BRONZE ────────────────────────────────────────────────────────────────
    { code: 'FIRST_SUBJECT_COMPLETED', name: 'Primer Paso', description: 'Aprobar tu primera materia. ¡El viaje de mil materias empieza por una!', tier: 'BRONZE', rarity: 85 },
    { code: 'PERFECT_SCORE_10', name: 'Perfección', description: 'Lograr un 10 perfecto en alguna materia. La nota máxima de la escala.', tier: 'BRONZE', rarity: 15 },
    { code: 'TEN_SUBJECTS_PASSED', name: 'Doble Dígito', description: 'Aprobar 10 materias o más. Ya dejaste atrás el cuarto del primer año.', tier: 'BRONZE', rarity: 50 },
    { code: 'YEAR_1_COMPLETION', name: 'Primer Año', description: 'Completar todas las materias del 1er año. La base está sólida.', tier: 'BRONZE', rarity: 40 },
    { code: 'YEAR_2_COMPLETION', name: 'Segundo Año', description: 'Completar todas las materias del 2do año. Ya pasaste el ecuador del inicial.', tier: 'BRONZE', rarity: 25 },
    { code: 'DIFFICULT_SUBJECT_PASSED', name: 'Dominador', description: 'Aprobar una materia con dificultad percibida ≥ 80.', tier: 'BRONZE', rarity: 35 },
    { code: 'HOURS_100_COMPLETED', name: 'Maratonista', description: 'Acumular 100 o más horas aprobadas.', tier: 'BRONZE', rarity: 70 },
    { code: 'CONSISTENCY_BRONZE', name: 'Constante', description: 'Tener aprobaciones en 4 o más cuatrimestres distintos.', tier: 'BRONZE', rarity: 28 },
    { code: 'AVERAGE_80_OVERALL', name: 'Sólido', description: 'Mantener un promedio general ≥ 8.', tier: 'BRONZE', rarity: 40 },
    { code: 'SEMESTER_AVERAGE_NINE', name: 'Excelencia Semestral', description: 'Tener un promedio ≥ 9 en algún cuatrimestre.', tier: 'BRONZE', rarity: 25 },
    { code: 'MIXED_STATUS_PASS', name: 'Versátil', description: 'Tener materias en ambos regímenes: regularizadas y aprobadas con final.', tier: 'BRONZE', rarity: 45 },
    { code: 'SUMMER_WARRIOR', name: 'Guerrero de Verano', description: 'Aprobar al menos una materia en un cuatrimestre de verano (3C).', tier: 'BRONZE', rarity: 32 },
    { code: 'DIFFICULTY_RESEARCHER', name: 'Investigador', description: 'Registrar la dificultad percibida en 5 o más materias.', tier: 'BRONZE', rarity: 38 },
    { code: 'DIVERSIFIED_YEARS', name: 'Diversificado', description: 'Tener aprobaciones en 4 años del plan distintos.', tier: 'BRONZE', rarity: 30 },
    { code: 'ALL_OPTIONALS_COMPLETED', name: 'Completista', description: 'Completar las 3 materias electivas.', tier: 'BRONZE', rarity: 20 },

    // ─── SILVER ────────────────────────────────────────────────────────────────
    { code: 'HALFWAY_COMPLETION', name: 'Punto Medio', description: 'Completar el 50% de la carrera. Ya estás en el descenso.', tier: 'SILVER', rarity: 50 },
    { code: 'INTERMEDIATE_DEGREE', name: 'Grado Intermedio', description: 'Completar todas las materias del título intermedio.', tier: 'SILVER', rarity: 40 },
    { code: 'CONSISTENCY_SILVER', name: 'Persistente', description: 'Tener aprobaciones en 8 o más cuatrimestres distintos.', tier: 'SILVER', rarity: 25 },
    { code: 'HIGH_DIFFICULTY_MASTERY', name: 'Conquistador', description: 'Aprobar 5 materias con dificultad percibida alta (≥ 70).', tier: 'SILVER', rarity: 20 },
    { code: 'QUICK_PROGRESS', name: 'Velocidad', description: 'Aprobar materias que suman 15 o más horas en un solo cuatrimestre.', tier: 'SILVER', rarity: 32 },
    { code: 'EXCELLENCE_85_PLUS', name: 'Distinguido', description: 'Mantener un promedio general ≥ 8.5.', tier: 'SILVER', rarity: 28 },
    { code: 'YEAR_3_COMPLETION', name: 'Tercer Año', description: 'Completar todas las materias del 3er año.', tier: 'SILVER', rarity: 22 },
    { code: 'GROWING_AVERAGE', name: 'En Ascenso', description: 'Tener un promedio cuatrimestral creciente en 3 cuatrimestres consecutivos.', tier: 'SILVER', rarity: 22 },
    { code: 'HOURS_200_COMPLETED', name: 'Ultra Maratonista', description: 'Acumular 200 horas aprobadas.', tier: 'SILVER', rarity: 30 },
    { code: 'ALL_ENGLISH_COMPLETED', name: 'Poliglota', description: 'Completar las 4 materias de Inglés Transversal.', tier: 'SILVER', rarity: 35 },

    // ─── GOLD ──────────────────────────────────────────────────────────────────
    { code: 'YEAR_4_COMPLETION', name: 'Cuarto Año', description: 'Completar todas las materias del 4to año. La cima ya se ve.', tier: 'GOLD', rarity: 15 },
    { code: 'PERFECT_AVERAGE', name: 'Genio Académico', description: 'Mantener un promedio general ≥ 9.', tier: 'GOLD', rarity: 5 },
    { code: 'CONSISTENT_EXCELLENCE', name: 'Excelencia Consistente', description: 'Tener promedio ≥ 8.5 en el 80% de los cuatrimestres con aprobaciones.', tier: 'GOLD', rarity: 10 },
    { code: 'CHALLENGE_ACCEPTED', name: 'Desafío Aceptado', description: 'Aprobar 10 o más materias con dificultad percibida alta (≥ 70).', tier: 'GOLD', rarity: 8 },
    { code: 'MARATHON_CHAMPION', name: 'Campeón Maratonista', description: 'Acumular 230 o más horas aprobadas.', tier: 'GOLD', rarity: 10 },
    { code: 'CONSISTENCY_GOLD', name: 'Imparable', description: 'Tener aprobaciones en 12 o más cuatrimestres distintos.', tier: 'GOLD', rarity: 10 },
    { code: 'CAREER_COMPLETION', name: 'Graduado', description: 'Completar el 100% de las materias obligatorias.', tier: 'GOLD', rarity: 8 },

    // ─── PLATINUM ──────────────────────────────────────────────────────────────
    { code: 'LEGEND', name: 'Leyenda', description: '100% de la carrera completada + promedio general ≥ 9. El máximo honor académico.', tier: 'PLATINUM', rarity: 1 },
];

// ─── Local Evaluator ───────────────────────────────────────────────────────────

type ApprovedSubject = Subject & { grade: number | null; statusDate: string | null };

function getApproved(subjects: Subject[]): ApprovedSubject[] {
    return subjects.filter(
        s => s.status === SubjectStatus.APROBADA || s.status === SubjectStatus.EQUIVALENCIA
    ) as ApprovedSubject[];
}

function getRegularized(subjects: Subject[]) {
    return subjects.filter(s => s.status === SubjectStatus.REGULARIZADA);
}

function getSemesterKey(dateStr: string | null): string | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = d.getMonth() + 1; // 1-12
    const q = m <= 4 ? 'Q1' : m <= 8 ? 'Q2' : 'Q3';
    return `${y}-${q}`;
}

function getAvgGrade(subjects: ApprovedSubject[]): number {
    const graded = subjects.filter(s => s.grade !== null);
    if (graded.length === 0) return 0;
    return graded.reduce((s, c) => s + (c.grade ?? 0), 0) / graded.length;
}

function isUnlocked(code: string, subjects: Subject[]): boolean {
    const approved = getApproved(subjects);
    const regularized = getRegularized(subjects);
    const allDone = [...approved, ...regularized];
    const optional = subjects.filter(s => s.isOptional);
    const mandatory = subjects.filter(s => !s.isOptional);

    switch (code) {
        case 'FIRST_SUBJECT_COMPLETED':
            return approved.length >= 1;

        case 'PERFECT_SCORE_10':
            return approved.some(s => s.grade === 10);

        case 'TEN_SUBJECTS_PASSED':
            return approved.length >= 10;

        case 'YEAR_1_COMPLETION': {
            const yr1 = subjects.filter(s => s.year === 1 && !s.isOptional);
            return yr1.length > 0 && yr1.every(s => s.status === SubjectStatus.APROBADA || s.status === SubjectStatus.EQUIVALENCIA);
        }

        case 'YEAR_2_COMPLETION': {
            const yr2 = subjects.filter(s => s.year === 2 && !s.isOptional);
            return yr2.length > 0 && yr2.every(s => s.status === SubjectStatus.APROBADA || s.status === SubjectStatus.EQUIVALENCIA);
        }

        case 'YEAR_3_COMPLETION': {
            const yr3 = subjects.filter(s => s.year === 3 && !s.isOptional);
            return yr3.length > 0 && yr3.every(s => s.status === SubjectStatus.APROBADA || s.status === SubjectStatus.EQUIVALENCIA);
        }

        case 'YEAR_4_COMPLETION': {
            const yr4 = subjects.filter(s => s.year === 4 && !s.isOptional);
            return yr4.length > 0 && yr4.every(s => s.status === SubjectStatus.APROBADA || s.status === SubjectStatus.EQUIVALENCIA);
        }

        case 'DIFFICULT_SUBJECT_PASSED':
            return approved.some(s => (s.difficulty ?? 0) >= 80);

        case 'HOURS_100_COMPLETED':
            return allDone.reduce((acc, s) => acc + (s.hours ?? 0), 0) >= 100;

        case 'HOURS_200_COMPLETED':
            return allDone.reduce((acc, s) => acc + (s.hours ?? 0), 0) >= 200;

        case 'MARATHON_CHAMPION':
            return allDone.reduce((acc, s) => acc + (s.hours ?? 0), 0) >= 230;

        case 'CONSISTENCY_BRONZE': {
            const semesters = new Set(approved.map(s => getSemesterKey(s.statusDate)).filter(Boolean));
            return semesters.size >= 4;
        }

        case 'CONSISTENCY_SILVER': {
            const semesters = new Set(approved.map(s => getSemesterKey(s.statusDate)).filter(Boolean));
            return semesters.size >= 8;
        }

        case 'CONSISTENCY_GOLD': {
            const semesters = new Set(approved.map(s => getSemesterKey(s.statusDate)).filter(Boolean));
            return semesters.size >= 12;
        }

        case 'AVERAGE_80_OVERALL':
            return getAvgGrade(approved) >= 8;

        case 'EXCELLENCE_85_PLUS':
            return getAvgGrade(approved) >= 8.5;

        case 'PERFECT_AVERAGE':
            return getAvgGrade(approved) >= 9;

        case 'SEMESTER_AVERAGE_NINE': {
            const bySemester = new Map<string, number[]>();
            for (const s of approved) {
                const key = getSemesterKey(s.statusDate);
                if (key && s.grade !== null) {
                    const list = bySemester.get(key) ?? [];
                    list.push(s.grade);
                    bySemester.set(key, list);
                }
            }
            for (const grades of bySemester.values()) {
                const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
                if (avg >= 9) return true;
            }
            return false;
        }

        case 'MIXED_STATUS_PASS':
            return approved.length > 0 && regularized.length > 0;

        case 'SUMMER_WARRIOR':
            return approved.some(s => {
                if (!s.statusDate) return false;
                const m = new Date(s.statusDate).getMonth() + 1;
                return m >= 9 || m <= 2; // Q3: Sept-Feb
            });

        case 'DIFFICULTY_RESEARCHER':
            return subjects.filter(s => s.difficulty !== null && s.difficulty !== undefined).length >= 5;

        case 'DIVERSIFIED_YEARS': {
            const years = new Set(approved.map(s => s.year));
            return years.size >= 4;
        }

        case 'ALL_OPTIONALS_COMPLETED': {
            const optApproved = optional.filter(s => s.status === SubjectStatus.APROBADA || s.status === SubjectStatus.EQUIVALENCIA);
            return optional.length > 0 && optApproved.length >= 3;
        }

        case 'HALFWAY_COMPLETION': {
            const mandatoryApproved = mandatory.filter(s => s.status === SubjectStatus.APROBADA || s.status === SubjectStatus.EQUIVALENCIA);
            return mandatory.length > 0 && (mandatoryApproved.length / mandatory.length) >= 0.5;
        }

        case 'INTERMEDIATE_DEGREE': {
            const intermediate = subjects.filter(s => s.isIntermediateDegree);
            return intermediate.length > 0 && intermediate.every(s => s.status === SubjectStatus.APROBADA || s.status === SubjectStatus.EQUIVALENCIA);
        }

        case 'HIGH_DIFFICULTY_MASTERY':
            return approved.filter(s => (s.difficulty ?? 0) >= 70).length >= 5;

        case 'CHALLENGE_ACCEPTED':
            return approved.filter(s => (s.difficulty ?? 0) >= 70).length >= 10;

        case 'QUICK_PROGRESS': {
            const bySemesterHours = new Map<string, number>();
            for (const s of approved) {
                const key = getSemesterKey(s.statusDate);
                if (key) {
                    bySemesterHours.set(key, (bySemesterHours.get(key) ?? 0) + (s.hours ?? 0));
                }
            }
            for (const h of bySemesterHours.values()) {
                if (h >= 15) return true;
            }
            return false;
        }

        case 'GROWING_AVERAGE': {
            const bySemester = new Map<string, number[]>();
            for (const s of approved) {
                const key = getSemesterKey(s.statusDate);
                if (key && s.grade !== null) {
                    const list = bySemester.get(key) ?? [];
                    list.push(s.grade);
                    bySemester.set(key, list);
                }
            }
            const avgs = Array.from(bySemester.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([, grades]) => grades.reduce((a, b) => a + b, 0) / grades.length);
            let streak = 0;
            for (let i = 1; i < avgs.length; i++) {
                if (avgs[i] > avgs[i - 1]) {
                    streak++;
                    if (streak >= 2) return true; // 3 consecutive = 2 increases
                } else {
                    streak = 0;
                }
            }
            return false;
        }

        case 'ALL_ENGLISH_COMPLETED': {
            const english = subjects.filter(s => ['901', '902', '903', '904'].includes(s.planCode));
            return english.length >= 4 && english.every(s => s.status === SubjectStatus.APROBADA || s.status === SubjectStatus.EQUIVALENCIA);
        }

        case 'CAREER_COMPLETION': {
            const mandatoryApproved = mandatory.filter(s => s.status === SubjectStatus.APROBADA || s.status === SubjectStatus.EQUIVALENCIA);
            return mandatory.length > 0 && mandatoryApproved.length >= mandatory.length;
        }

        case 'CONSISTENT_EXCELLENCE': {
            const bySemester = new Map<string, number[]>();
            for (const s of approved) {
                const key = getSemesterKey(s.statusDate);
                if (key && s.grade !== null) {
                    const list = bySemester.get(key) ?? [];
                    list.push(s.grade);
                    bySemester.set(key, list);
                }
            }
            if (bySemester.size === 0) return false;
            const aboveThreshold = Array.from(bySemester.values()).filter(
                grades => grades.reduce((a, b) => a + b, 0) / grades.length >= 8.5
            ).length;
            return aboveThreshold / bySemester.size >= 0.8;
        }

        case 'LEGEND': {
            const mandatoryApproved = mandatory.filter(s => s.status === SubjectStatus.APROBADA || s.status === SubjectStatus.EQUIVALENCIA);
            const complete = mandatory.length > 0 && mandatoryApproved.length >= mandatory.length;
            return complete && getAvgGrade(approved) >= 9;
        }

        default:
            return false;
    }
}

/** Build a TrophyCaseDto entirely from local Subject[] data — no API needed. */
export function buildGuestTrophyCase(subjects: Subject[]): TrophyCaseDto {
    const trophies: TrophyDto[] = GUEST_TROPHY_DEFS.map(def => ({
        id: def.code,
        code: def.code,
        name: def.name,
        description: def.description,
        tier: def.tier,
        icon: TIER_ICONS[def.tier],
        rarity: def.rarity,
        unlocked: isUnlocked(def.code, subjects),
        unlockedAt: undefined,
        progress: isUnlocked(def.code, subjects) ? 100 : 0,
    }));

    const unlocked = trophies.filter(t => t.unlocked);

    const byTier = (['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] as TrophyTier[]).reduce((acc, tier) => {
        const tierTrophies = trophies.filter(t => t.tier === tier);
        const unlockedCount = tierTrophies.filter(t => t.unlocked).length;
        acc[tier.toLowerCase() as 'bronze' | 'silver' | 'gold' | 'platinum'] = {
            tier,
            unlocked: unlockedCount,
            total: tierTrophies.length,
            percentage: tierTrophies.length > 0 ? Math.round((unlockedCount / tierTrophies.length) * 100) : 0,
        };
        return acc;
    }, {} as TrophyCaseDto['byTier']);

    return {
        totalTrophies: trophies.length,
        unlockedCount: unlocked.length,
        unlockedPercentage: trophies.length > 0 ? Math.round((unlocked.length / trophies.length) * 100) : 0,
        byTier,
        trophies,
        recentlyUnlocked: [],
    };
}
