import { TrophyTier } from '../../../common/constants/trophy-enums';
import { TrophySeedDefinition } from '../types';

/**
 * Trophy Definitions - 33 total
 * 15 Bronze, 10 Silver, 7 Gold, 1 Platinum
 */
export const TROPHY_DEFINITIONS: TrophySeedDefinition[] = [
  // =================== BRONZE (15) ===================

  {
    code: 'FIRST_SUBJECT_COMPLETED',
    name: 'Primer Paso',
    description: 'Completar tu primera materia',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=First',
    rarity: 85,
    criteria: 'At least 1 subject passed',
  },
  {
    code: 'THREE_SUBJECT_STREAK',
    name: 'Racha Triple',
    description: '3 materias pasadas consecutivas',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=Streak3',
    rarity: 60,
    criteria: '3 consecutive subjects passed',
  },
  {
    code: 'PERFECT_SCORE_100',
    name: 'Perfección',
    description: 'Lograr una nota perfecta de 100',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=Perfect',
    rarity: 15,
    criteria: 'At least 1 subject with grade = 100',
  },
  {
    code: 'YEAR_1_COMPLETION',
    name: 'Primer Año',
    description: 'Completar todas las materias de 1er año',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=Year1',
    rarity: 40,
    criteria: 'All 1st year subjects passed',
  },
  {
    code: 'DIFFICULT_SUBJECT_PASSED',
    name: 'Dominador',
    description: 'Pasar una materia con dificultad percibida ≥ 8',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=Difficult',
    rarity: 35,
    criteria: 'Pass a subject with perceived difficulty ≥ 8',
  },
  {
    code: 'ALL_OPTIONALS_COMPLETED',
    name: 'Completista',
    description: 'Completar todas las materias optativas',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=Optional',
    rarity: 20,
    criteria: 'All optional subjects passed',
  },
  {
    code: 'SEMESTER_AVERAGE_90',
    name: 'Excelencia Semestral',
    description: 'Promedio ≥ 90 en un semestre',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=Avg90',
    rarity: 25,
    criteria: 'At least one semester with average ≥ 90',
  },
  {
    code: 'YEAR_NO_FAILURES',
    name: 'Año Limpio',
    description: 'Pasar todas las materias en un año',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=Clean',
    rarity: 30,
    criteria: 'Complete a full year without failures',
  },
  {
    code: 'TEN_SUBJECTS_PASSED',
    name: 'Doble Dígito',
    description: 'Pasar 10+ materias',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=10+',
    rarity: 50,
    criteria: '10 or more subjects passed',
  },
  {
    code: 'EARLY_BIRD',
    name: 'Adelantado',
    description: 'Completar una materia antes de su semestre',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=Early',
    rarity: 35,
    criteria: 'Pass a subject before its scheduled semester',
  },
  {
    code: 'CONSISTENCY_BRONZE',
    name: 'Consistencia',
    description: '5+ semestres con aprobaciones',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=Const',
    rarity: 28,
    criteria: '5+ semesters with at least 1 approval',
  },
  {
    code: 'AVERAGE_80_OVERALL',
    name: 'Sólido',
    description: 'Promedio general ≥ 80',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=Solid',
    rarity: 40,
    criteria: 'Overall average ≥ 80',
  },
  {
    code: 'MIXED_STATUS_PASS',
    name: 'Versátil',
    description: 'Pasar tanto materias regulares como finales',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=Mixed',
    rarity: 45,
    criteria: 'Pass both REGULARIZADA and APROBADA',
  },
  {
    code: 'YEAR_2_COMPLETION',
    name: 'Segundo Año',
    description: 'Completar todas las materias de 2do año',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=Year2',
    rarity: 25,
    criteria: 'All 2nd year subjects passed',
  },
  {
    code: 'HOURS_100_COMPLETED',
    name: 'Maratonista',
    description: 'Completar 100+ horas',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=100hrs',
    rarity: 70,
    criteria: '100+ hours completed',
  },

  // =================== SILVER (10) ===================

  {
    code: 'HALFWAY_COMPLETION',
    name: 'Punto Medio',
    description: 'Completar 50% de la carrera',
    tier: TrophyTier.SILVER,
    icon: 'https://via.placeholder.com/64?text=Halfway',
    rarity: 50,
    criteria: '50% of subjects completed',
  },
  {
    code: 'TWO_SEMESTERS_CLEAN',
    name: 'Dos Semestres Limpios',
    description: 'Aprobar todas las materias en 2 semestres consecutivos',
    tier: TrophyTier.SILVER,
    icon: 'https://via.placeholder.com/64?text=2Sem',
    rarity: 35,
    criteria: '2 consecutive semesters with 100% pass rate',
  },
  {
    code: 'MASTER_OF_BALANCE',
    name: 'Equilibrista',
    description: 'Promedio 80+ sin caídas de rendimiento',
    tier: TrophyTier.SILVER,
    icon: 'https://via.placeholder.com/64?text=Balance',
    rarity: 30,
    criteria: 'Average ≥ 80 across all subjects',
  },
  {
    code: 'INTERMEDIATE_DEGREE',
    name: 'Grado Intermedio',
    description: 'Completar el grado intermedio',
    tier: TrophyTier.SILVER,
    icon: 'https://via.placeholder.com/64?text=Intermediate',
    rarity: 40,
    criteria: 'Complete intermediate degree',
  },
  {
    code: 'CONSISTENCY_SILVER',
    name: 'Consistencia Plata',
    description: '8+ semestres sin abandonar',
    tier: TrophyTier.SILVER,
    icon: 'https://via.placeholder.com/64?text=Cons8',
    rarity: 25,
    criteria: '8+ semesters with at least 1 approval each',
  },
  {
    code: 'PERFECT_SEMESTER',
    name: 'Semestre Perfecto',
    description: 'Pasar todas las materias en un semestre con promedio 90+',
    tier: TrophyTier.SILVER,
    icon: 'https://via.placeholder.com/64?text=PerfSem',
    rarity: 18,
    criteria: 'Perfect semester completion',
  },
  {
    code: 'HIGH_DIFFICULTY_MASTERY',
    name: 'Conquistador',
    description: 'Pasar 5+ materias con dificultad percibida alta',
    tier: TrophyTier.SILVER,
    icon: 'https://via.placeholder.com/64?text=Master',
    rarity: 20,
    criteria: '5+ difficult subjects passed',
  },
  {
    code: 'QUICK_PROGRESS',
    name: 'Velocidad',
    description: 'Completar 15+ horas en un solo semestre',
    tier: TrophyTier.SILVER,
    icon: 'https://via.placeholder.com/64?text=Velocity',
    rarity: 32,
    criteria: '15+ hours passed in one semester',
  },
  {
    code: 'EXCELLENCE_85_PLUS',
    name: 'Distinguido',
    description: 'Promedio gral ≥ 85',
    tier: TrophyTier.SILVER,
    icon: 'https://via.placeholder.com/64?text=85+',
    rarity: 28,
    criteria: 'Overall average ≥ 85',
  },
  {
    code: 'STRATEGIC_PLANNING',
    name: 'Estratega',
    description: 'Completar 20+ subjects con menos de 5 failures',
    tier: TrophyTier.SILVER,
    icon: 'https://via.placeholder.com/64?text=Strategy',
    rarity: 22,
    criteria: 'Complex path with minimal failures',
  },

  // =================== GOLD (7) ===================

  {
    code: 'CAREER_COMPLETION',
    name: 'Graduado',
    description: 'Completar todas las materias de la carrera',
    tier: TrophyTier.GOLD,
    icon: 'https://via.placeholder.com/64?text=Complete',
    rarity: 8,
    criteria: '100% degree completion',
  },
  {
    code: 'PERFECT_AVERAGE',
    name: 'Genio Académico',
    description: 'Promedio final ≥ 90',
    tier: TrophyTier.GOLD,
    icon: 'https://via.placeholder.com/64?text=Genius',
    rarity: 5,
    criteria: 'Overall average ≥ 90',
  },
  {
    code: 'SPEED_RUNNER',
    name: 'Corredor de Velocidad',
    description: 'Completar en menos de 2.5 años',
    tier: TrophyTier.GOLD,
    icon: 'https://via.placeholder.com/64?text=Speed',
    rarity: 6,
    criteria: 'Complete all subjects in <2.5 years',
  },
  {
    code: 'FLAWLESS_EXECUTION',
    name: 'Ejecución Impecable',
    description: 'Pasar todas excepto 1-2 materias al 1er intento',
    tier: TrophyTier.GOLD,
    icon: 'https://via.placeholder.com/64?text=Flawless',
    rarity: 12,
    criteria: 'Near-perfect first-attempt pass rate',
  },
  {
    code: 'CONSISTENT_EXCELLENCE',
    name: 'Excelencia Consistente',
    description: '80% de semestres con promedio 85+',
    tier: TrophyTier.GOLD,
    icon: 'https://via.placeholder.com/64?text=Excel',
    rarity: 10,
    criteria: 'High performance across most semesters',
  },
  {
    code: 'CHALLENGE_ACCEPTED',
    name: 'Desafío Aceptado',
    description: 'Pasar todos los "mata-promedios" (top 5 hardest)',
    tier: TrophyTier.GOLD,
    icon: 'https://via.placeholder.com/64?text=Challenge',
    rarity: 8,
    criteria: 'Pass all hardest subjects',
  },
  {
    code: 'MARATHON_CHAMPION',
    name: 'Campeón Maratonista',
    description: 'Completar 200+ horas',
    tier: TrophyTier.GOLD,
    icon: 'https://via.placeholder.com/64?text=Marathon',
    rarity: 12,
    criteria: '200+ hours completed',
  },

  // =================== PLATINUM (1) ===================

  {
    code: 'LEGEND',
    name: 'Leyenda',
    description: 'Todas las medallas de oro + promedio ≥ 90 + sin retakes',
    tier: TrophyTier.PLATINUM,
    icon: 'https://via.placeholder.com/64?text=Legend',
    rarity: 1,
    criteria: 'All gold criteria met at highest level',
  },
];

/**
 * Get trophy definition by code
 */
export function getTrophyDefinition(
  code: string,
): TrophySeedDefinition | undefined {
  return TROPHY_DEFINITIONS.find((t) => t.code === code);
}

/**
 * Get all trophy definitions by tier
 */
export function getTrophiesByTier(tier: TrophyTier): TrophySeedDefinition[] {
  return TROPHY_DEFINITIONS.filter((t) => t.tier === tier);
}
