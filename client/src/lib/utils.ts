// client/src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Función para combinar clases de Tailwind evitando conflictos
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatear nombre de materia truncado para nodos pequeños
 */
export function truncateSubjectName(name: string, maxLength = 30): string {
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength - 3) + '...';
}

/**
 * Obtener emoji basado en el estado de la materia
 */
export function getSubjectEmoji(status: string): string {
  const emojiMap: Record<string, string> = {
    PENDIENTE: '🔒',
    DISPONIBLE: '🎯',
    EN_CURSO: '📚',
    REGULARIZADA: '✅',
    APROBADA: '🏆',
  };
  return emojiMap[status] || '❓';
}

/**
 * Generar color aleatorio para efectos visuales
 */
export function getRandomRetroColor(): string {
  const colors = [
    '#73D216', '#FCE94F', '#729FCF', '#AD7FA8', 
    '#EF2929', '#F57900', '#8AE234'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Calcular progreso de la carrera
 */
export function calculateProgress(
  totalSubjects: number,
  approvedSubjects: number
): number {
  if (totalSubjects === 0) return 0;
  return Math.round((approvedSubjects / totalSubjects) * 100);
}

/**
 * Agrupar materias por semestre
 */
export function groupBySemester<T extends { semester: number }>(
  items: T[]
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
  if (grade === null) return '—';
  if (grade >= 8) return `⭐ ${grade}`;
  if (grade >= 6) return `✓ ${grade}`;
  return `${grade}`;
}

/**
 * Formatear fecha YYYY-MM-DD a formato legible
 */
export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date + 'T00:00:00').toLocaleDateString('es-AR');
}

/**
 * Delay para simulaciones (útil para testing)
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Debounce para optimización de renders
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
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
export function isValidSubject(subject: unknown): boolean {
  if (!subject || typeof subject !== 'object') return false;
  
  const s = subject as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    typeof s.planCode === 'string' &&
    typeof s.name === 'string' &&
    typeof s.semester === 'number' &&
    typeof s.status === 'string'
  );
}
