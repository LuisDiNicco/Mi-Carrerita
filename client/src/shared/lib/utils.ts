import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Funcion para combinar clases de Tailwind evitando conflictos
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatear nombre de materia truncado para nodos pequenos
 */
export function truncateSubjectName(name: string, maxLength = 30): string {
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength - 3) + "...";
}

/**
 * Obtener emoji basado en el estado de la materia
 */
export function getSubjectEmoji(status: string): string {
  const emojiMap: Record<string, string> = {
    PENDIENTE: "🔒",
    DISPONIBLE: "🎯",
    EN_CURSO: "📚",
    REGULARIZADA: "✅",
    APROBADA: "🏆",
  };
  return emojiMap[status] || "❓";
}

/**
 * Generar color aleatorio para efectos visuales
 */
export function getRandomRetroColor(): string {
  const colors = [
    "#73D216",
    "#FCE94F",
    "#729FCF",
    "#AD7FA8",
    "#EF2929",
    "#F57900",
    "#8AE234",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Calcular progreso de la carrera
 */
export function calculateProgress(
  totalSubjects: number,
  approvedSubjects: number,
): number {
  if (totalSubjects === 0) return 0;
  return Math.round((approvedSubjects / totalSubjects) * 100);
}

/**
 * Agrupar materias por semestre
 */
export function groupBySemester<T extends { semester: number }>(
  items: T[],
): Map<number, T[]> {
  return items.reduce((acc, item) => {
    const semester = item.semester;
    if (!acc.has(semester)) {
      acc.set(semester, []);
    }
    acc.get(semester)!.push(item);
    return acc;
  }, new Map<number, T[]>());
}

/**
 * Formatear nota con estilo retro
 */
export function formatGrade(grade: number | null): string {
  if (grade === null) return "—";
  if (grade >= 8) return `⭐ ${grade}`;
  if (grade >= 6) return `✓ ${grade}`;
  return `${grade}`;
}

/**
 * Formatear fecha YYYY-MM-DD a formato legible DD/MM/YYYY
 */
export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date + 'T00:00:00').toLocaleDateString('es-AR');
}

/**
 * Convert a DD/MM/YYYY user input string to ISO format YYYY-MM-DD for the API.
 * Returns empty string if the input is invalid.
 */
export function toISODate(ddmmyyyy: string): string {
  if (!ddmmyyyy) return '';
  const parts = ddmmyyyy.split('/');
  if (parts.length !== 3) return '';
  const [dd, mm, yyyy] = parts;
  if (!dd || !mm || !yyyy || yyyy.length < 4) return '';
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

/**
 * Convert an ISO date string YYYY-MM-DD to DD/MM/YYYY for display in inputs.
 * Returns empty string if the input is falsy.
 */
export function fromISODate(iso: string | null | undefined): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [yyyy, mm, dd] = parts;
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Delay para simulaciones (util para testing)
 */
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Debounce para optimizacion de renders
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Validar estructura de Subject
 */
