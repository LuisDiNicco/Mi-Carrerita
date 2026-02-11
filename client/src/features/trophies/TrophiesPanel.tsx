import { useMemo } from 'react';
import { useAcademicStore } from '../academic/store/academic-store';
import { SubjectStatus } from '../../shared/types/academic';

const TROPHY_IMAGES = {
  bronze: '/bronze-trophie.png',
  silver: '/silver-trophie.png',
  gold: '/gold-trophie.png',
  platinum: '/platinum-trophie.png',
};

const TROPHIES = [
  { id: 'b1', tier: 'bronze', label: 'Bronce', description: 'Aprobar tu primera materia', threshold: 1 },
  { id: 'b2', tier: 'bronze', label: 'Bronce', description: 'Aprobar 2 materias', threshold: 2 },
  { id: 'b3', tier: 'bronze', label: 'Bronce', description: 'Aprobar 3 materias', threshold: 3 },
  { id: 'b4', tier: 'bronze', label: 'Bronce', description: 'Completar el 10% de la carrera', threshold: 0.1, isPercent: true },
  { id: 'b5', tier: 'bronze', label: 'Bronce', description: 'Completar el 20% de la carrera', threshold: 0.2, isPercent: true },
  { id: 'b6', tier: 'bronze', label: 'Bronce', description: 'Sacar una nota mayor o igual a 7', threshold: 7, isGrade: true },
  { id: 'b7', tier: 'bronze', label: 'Bronce', description: 'Cursar una materia', threshold: 1, isInProgress: true },
  { id: 'b8', tier: 'bronze', label: 'Bronce', description: 'Registrar una dificultad', threshold: 1, isDifficulty: true },
  { id: 's1', tier: 'silver', label: 'Plata', description: 'Aprobar 5 materias', threshold: 5 },
  { id: 's2', tier: 'silver', label: 'Plata', description: 'Completar el 35% de la carrera', threshold: 0.35, isPercent: true },
  { id: 's3', tier: 'silver', label: 'Plata', description: 'Promedio mayor o igual a 7.5', threshold: 7.5, isAverage: true },
  { id: 's4', tier: 'silver', label: 'Plata', description: 'Aprobar 8 materias', threshold: 8 },
  { id: 'g1', tier: 'gold', label: 'Oro', description: 'Aprobar 12 materias', threshold: 12 },
  { id: 'g2', tier: 'gold', label: 'Oro', description: 'Completar el 70% de la carrera', threshold: 0.7, isPercent: true },
  { id: 'p1', tier: 'platinum', label: 'Platino', description: 'Recibirse (100%)', threshold: 1, isPercent: true },
];

const MIN_GRADE_GOAL = 7;
const AVERAGE_GOAL = 7.5;

export const TrophiesPanel = () => {
  const subjects = useAcademicStore((state) => state.subjects);

  const stats = useMemo(() => {
    const total = subjects.length;
    const approved = subjects.filter((subject) => subject.status === SubjectStatus.APROBADA);
    const approvedCount = approved.length;
    const hasHighGrade = subjects.some((subject) => (subject.grade ?? 0) >= MIN_GRADE_GOAL);
    const hasDifficulty = subjects.some((subject) => (subject.difficulty ?? 0) > 0);
    const inProgressCount = subjects.filter((subject) => subject.status === SubjectStatus.EN_CURSO).length;
    const avgGrade = approved.length
      ? approved.reduce((sum, subject) => sum + (subject.grade ?? 0), 0) / approved.length
      : 0;
    const progress = total > 0 ? approvedCount / total : 0;
    return { approvedCount, avgGrade, progress, hasHighGrade, hasDifficulty, inProgressCount };
  }, [subjects]);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-app bg-elevated p-4 shadow-subtle">
        <h3 className="text-lg font-bold text-app">Sala de trofeos</h3>
        <p className="text-sm text-muted">
          Hitos simples para celebrar tu progreso. Se desbloquean automaticamente.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {TROPHIES.map((trophy) => {
          const achieved = trophy.isPercent
            ? stats.progress >= trophy.threshold
            : trophy.isGrade
              ? stats.hasHighGrade
              : trophy.isAverage
                ? stats.avgGrade >= AVERAGE_GOAL
                : trophy.isInProgress
                  ? stats.inProgressCount >= trophy.threshold
                  : trophy.isDifficulty
                    ? stats.hasDifficulty
                    : stats.approvedCount >= trophy.threshold;

          return (
            <div
              key={trophy.id}
              className={`rounded-2xl border p-4 shadow-subtle ${
                achieved ? 'border-accent bg-surface' : 'border-app bg-elevated'
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={TROPHY_IMAGES[trophy.tier as keyof typeof TROPHY_IMAGES]}
                  alt={trophy.label}
                  className="h-12 w-12"
                />
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted">{trophy.label}</p>
                  <h4 className="text-base font-bold text-app">{trophy.description}</h4>
                  <p className="text-sm text-muted">
                    Estado: {achieved ? 'Desbloqueado' : 'Pendiente'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-app bg-elevated p-4 shadow-subtle">
        <h4 className="text-base font-bold text-app">Meta de notas</h4>
        <p className="text-sm text-muted">
          Promedio actual: {stats.avgGrade.toFixed(2)}. Meta recomendada: {MIN_GRADE_GOAL}+.
        </p>
      </div>
    </section>
  );
};
