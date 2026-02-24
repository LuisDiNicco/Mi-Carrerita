import { TrophyTier } from '../../../common/constants/trophy-enums';
import { TrophySeedDefinition } from '../types';

/**
 * Trophy Definitions — 34 total
 * 15 Bronze, 10 Silver, 7 Gold, 1 Platinum + 1 special
 *
 * Realistic criteria — only what the app can actually validate:
 *  - Subject status (APROBADA, EQUIVALENCIA, REGULARIZADA, RECURSADA)
 *  - Grades (1-10)
 *  - Difficulty (1-100 perceived)
 *  - Dates / quarters of approval
 *  - Academic progress counts and hours
 *
 * Removed unrealistic trophies:
 *  - SPEED_RUNNER (career takes 5+ years, 2.5 is impossible)
 *  - FLAWLESS_EXECUTION / YEAR_NO_FAILURES / LEGEND w/ "no retakes" (no failure tracking)
 */
export const TROPHY_DEFINITIONS: TrophySeedDefinition[] = [
  // =================== BRONZE (15) ===================

  {
    code: 'FIRST_SUBJECT_COMPLETED',
    name: 'Primer Paso',
    description: 'Aprobar tu primera materia. ¡El viaje de mil materias empieza por una!',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=🥇',
    rarity: 85,
    criteria: 'At least 1 subject approved (APROBADA or EQUIVALENCIA)',
  },
  {
    code: 'PERFECT_SCORE_10',
    name: 'Perfección',
    description: 'Lograr un 10 perfecto en alguna materia. La nota máxima de la escala.',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=🌟',
    rarity: 15,
    criteria: 'At least 1 subject with grade = 10',
  },
  {
    code: 'TEN_SUBJECTS_PASSED',
    name: 'Doble Dígito',
    description: 'Aprobar 10 materias o más. Ya dejaste atrás el cuarto del primer año.',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=🔟',
    rarity: 50,
    criteria: '10 or more subjects approved',
  },
  {
    code: 'YEAR_1_COMPLETION',
    name: 'Primer Año',
    description: 'Completar todas las materias del 1er año. La base está sólida.',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=📗',
    rarity: 40,
    criteria: 'All 1st year subjects approved',
  },
  {
    code: 'YEAR_2_COMPLETION',
    name: 'Segundo Año',
    description: 'Completar todas las materias del 2do año. Ya pasaste el ecuador del inicial.',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=📘',
    rarity: 25,
    criteria: 'All 2nd year subjects approved',
  },
  {
    code: 'DIFFICULT_SUBJECT_PASSED',
    name: 'Dominador',
    description:
      'Aprobar una materia con dificultad percibida ≥ 80. Las materias bravas también caen.',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=💪',
    rarity: 35,
    criteria: 'Pass a subject with perceived difficulty ≥ 80',
  },
  {
    code: 'HOURS_100_COMPLETED',
    name: 'Maratonista',
    description: 'Acumular 100 o más horas aprobadas. El esfuerzo se mide en horas.',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=⏱️',
    rarity: 70,
    criteria: '100+ academic hours completed',
  },
  {
    code: 'CONSISTENCY_BRONZE',
    name: 'Constante',
    description: 'Tener aprobaciones en 4 o más cuatrimestres distintos. La continuidad es clave.',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=📅',
    rarity: 28,
    criteria: '4+ semesters with at least 1 approval',
  },
  {
    code: 'AVERAGE_80_OVERALL',
    name: 'Sólido',
    description: 'Mantener un promedio general ≥ 8. Solidez académica demostrada.',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=📊',
    rarity: 40,
    criteria: 'Overall average grade ≥ 8 (scale 1-10)',
  },
  {
    code: 'SEMESTER_AVERAGE_NINE',
    name: 'Excelencia Semestral',
    description: 'Tener un promedio ≥ 9 en algún cuatrimestre. Ese fue un semestre redondo.',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=✨',
    rarity: 25,
    criteria: 'At least one semester with average grade ≥ 9',
  },
  {
    code: 'MIXED_STATUS_PASS',
    name: 'Versátil',
    description:
      'Tener materias en ambos regímenes: regularizadas y aprobadas con final. Lo tuyo es la adaptabilidad.',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=🔀',
    rarity: 45,
    criteria: 'Have both REGULARIZADA and APROBADA subjects',
  },
  {
    code: 'SUMMER_WARRIOR',
    name: 'Guerrero de Verano',
    description:
      'Aprobar al menos una materia en un cuatrimestre de verano (3C). El calor no te para.',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=☀️',
    rarity: 32,
    criteria: 'At least 1 subject approved in a summer semester (Q3)',
  },
  {
    code: 'DIFFICULTY_RESEARCHER',
    name: 'Investigador',
    description:
      'Registrar la dificultad percibida en 5 o más materias. Tu feedback vale para todos.',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=🔬',
    rarity: 38,
    criteria: '5+ subjects with perceived difficulty recorded',
  },
  {
    code: 'DIVERSIFIED_YEARS',
    name: 'Diversificado',
    description:
      'Tener aprobaciones en 4 años del plan distintos. Tu avance es ancho, no solo profundo.',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=📐',
    rarity: 30,
    criteria: 'Have approvals across 4+ different plan years',
  },
  {
    code: 'ALL_OPTIONALS_COMPLETED',
    name: 'Completista',
    description:
      'Completar las 3 materias electivas. Fuiste más allá del mínimo requerido.',
    tier: TrophyTier.BRONZE,
    icon: 'https://via.placeholder.com/64?text=➕',
    rarity: 20,
    criteria: 'All 3 optional electiva subjects approved',
  },

  // =================== SILVER (10) ===================

  {
    code: 'HALFWAY_COMPLETION',
    name: 'Punto Medio',
    description: 'Completar el 50% de la carrera. Ya estás en el descenso.',
    tier: TrophyTier.SILVER,
    icon: 'https://via.placeholder.com/64?text=🎯',
    rarity: 50,
    criteria: '50% or more of subjects completed',
  },
  {
    code: 'INTERMEDIATE_DEGREE',
    name: 'Grado Intermedio',
    description: 'Completar todas las materias del título intermedio. Un logro en sí mismo.',
    tier: TrophyTier.SILVER,
    icon: 'https://via.placeholder.com/64?text=📜',
    rarity: 40,
    criteria: 'All intermediate degree subjects approved',
  },
  {
    code: 'CONSISTENCY_SILVER',
    name: 'Persistente',
    description: 'Tener aprobaciones en 8 o más cuatrimestres distintos. ¡Ocho temporadas de lucha!',
    tier: TrophyTier.SILVER,
    icon: 'https://via.placeholder.com/64?text=🔥',
    rarity: 25,
    criteria: '8+ semesters with at least 1 approval',
  },
  {
    code: 'HIGH_DIFFICULTY_MASTERY',
    name: 'Conquistador',
    description: 'Aprobar 5 materias con dificultad percibida alta (≥ 70). Cada una fue una batalla.',
    tier: TrophyTier.SILVER,
    icon: 'https://via.placeholder.com/64?text=⚔️',
    rarity: 20,
    criteria: '5+ subjects with difficulty ≥ 70 approved',
  },
  {
    code: 'QUICK_PROGRESS',
    name: 'Velocidad',
    description: 'Aprobar materias que suman 15 o más horas en un solo cuatrimestre.',
    tier: TrophyTier.SILVER,
    icon: 'https://via.placeholder.com/64?text=⚡',
    rarity: 32,
    criteria: '15+ academic hours approved in a single semester',
  },
  {
    code: 'EXCELLENCE_85_PLUS',
    name: 'Distinguido',
    description: 'Mantener un promedio general ≥ 8.5. Tu consistencia es admirable.',
    tier: TrophyTier.SILVER,
    icon: 'https://via.placeholder.com/64?text=🏅',
    rarity: 28,
    criteria: 'Overall average grade ≥ 8.5 (scale 1-10)',
  },
  {
    code: 'YEAR_3_COMPLETION',
    name: 'Tercer Año',
    description: 'Completar todas las materias del 3er año. Ya sos un veterano.',
    tier: TrophyTier.SILVER,
    icon: 'https://via.placeholder.com/64?text=📙',
    rarity: 22,
    criteria: 'All 3rd year subjects approved',
  },
  {
    code: 'GROWING_AVERAGE',
    name: 'En Ascenso',
    description:
      'Tener un promedio cuatrimestral creciente en 3 cuatrimestres consecutivos. Tu mejor momento está por venir.',
    tier: TrophyTier.SILVER,
    icon: 'https://via.placeholder.com/64?text=📈',
    rarity: 22,
    criteria: '3+ consecutive semesters with increasing average grade',
  },
  {
    code: 'HOURS_200_COMPLETED',
    name: 'Ultra Maratonista',
    description: 'Acumular 200 horas aprobadas. Dedicación de alto nivel.',
    tier: TrophyTier.SILVER,
    icon: 'https://via.placeholder.com/64?text=⏱',
    rarity: 30,
    criteria: '200+ academic hours completed',
  },
  {
    code: 'ALL_ENGLISH_COMPLETED',
    name: 'Poliglota',
    description:
      'Completar las 4 materias de Inglés Transversal. El idioma del futuro, conquistado.',
    tier: TrophyTier.SILVER,
    icon: 'https://via.placeholder.com/64?text=🌐',
    rarity: 35,
    criteria: 'All 4 English Transversal subjects approved (901, 902, 903, 904)',
  },

  // =================== GOLD (7) ===================

  {
    code: 'YEAR_4_COMPLETION',
    name: 'Cuarto Año',
    description: 'Completar todas las materias del 4to año. La cima ya se ve.',
    tier: TrophyTier.GOLD,
    icon: 'https://via.placeholder.com/64?text=📕',
    rarity: 15,
    criteria: 'All 4th year subjects approved',
  },
  {
    code: 'PERFECT_AVERAGE',
    name: 'Genio Académico',
    description: 'Mantener un promedio general ≥ 9. Estás en la élite académica.',
    tier: TrophyTier.GOLD,
    icon: 'https://via.placeholder.com/64?text=🧠',
    rarity: 5,
    criteria: 'Overall average grade ≥ 9 (scale 1-10)',
  },
  {
    code: 'CONSISTENT_EXCELLENCE',
    name: 'Excelencia Consistente',
    description:
      'Tener promedio ≥ 8.5 en el 80% de los cuatrimestres con aprobaciones. Alto rendimiento sin bajar la guardia.',
    tier: TrophyTier.GOLD,
    icon: 'https://via.placeholder.com/64?text=💎',
    rarity: 10,
    criteria: '80%+ of semesters with average ≥ 8.5',
  },
  {
    code: 'CHALLENGE_ACCEPTED',
    name: 'Desafío Aceptado',
    description:
      'Aprobar 10 o más materias con dificultad percibida alta (≥ 70). Sos un rompe-promedios.',
    tier: TrophyTier.GOLD,
    icon: 'https://via.placeholder.com/64?text=🏆',
    rarity: 8,
    criteria: '10+ subjects with difficulty ≥ 70 approved',
  },
  {
    code: 'MARATHON_CHAMPION',
    name: 'Campeón Maratonista',
    description: 'Acumular 230 o más horas aprobadas. Ya sos un atleta académico de élite.',
    tier: TrophyTier.GOLD,
    icon: 'https://via.placeholder.com/64?text=🏃',
    rarity: 10,
    criteria: '230+ academic hours completed',
  },
  {
    code: 'CONSISTENCY_GOLD',
    name: 'Imparable',
    description: 'Tener aprobaciones en 12 o más cuatrimestres distintos. Doce temporadas sin rendirse.',
    tier: TrophyTier.GOLD,
    icon: 'https://via.placeholder.com/64?text=🚀',
    rarity: 10,
    criteria: '12+ different semesters with at least 1 approval',
  },
  {
    code: 'CAREER_COMPLETION',
    name: 'Graduado',
    description:
      'Completar el 100% de las materias obligatorias. ¡Lo lograste! La carrera es tuya.',
    tier: TrophyTier.GOLD,
    icon: 'https://via.placeholder.com/64?text=🎓',
    rarity: 8,
    criteria: '100% of mandatory subjects approved (62/62)',
  },

  // =================== PLATINUM (1) ===================

  {
    code: 'LEGEND',
    name: 'Leyenda',
    description:
      '100% de la carrera completada + promedio general ≥ 9. El máximo honor académico. Tu nombre queda en los anales.',
    tier: TrophyTier.PLATINUM,
    icon: 'https://via.placeholder.com/64?text=👑',
    rarity: 1,
    criteria: '100% career completion AND overall average ≥ 9',
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
