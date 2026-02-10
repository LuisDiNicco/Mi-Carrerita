import { useMemo } from 'react';
import { useAcademicStore } from '../store/academic-store';
import { SubjectStatus } from '../types/academic';

const TROPHIES = [
  { id: 'first', label: 'Bronce', description: 'Aprobar tu primera materia', threshold: 1 },
  { id: 'grade', label: 'Plata', description: 'Sacar una nota mayor o igual a 7', threshold: 7, isGrade: true },
  { id: 'five', label: 'Oro', description: 'Aprobar 5 materias', threshold: 5 },
  { id: 'ten', label: 'Platino', description: 'Aprobar 10 materias', threshold: 10 },
  { id: 'half', label: 'Maestria', description: 'Completar el 50% de la carrera', threshold: 0.5, isPercent: true },
  { id: 'finish', label: 'Leyenda', description: 'Recibirse (100%)', threshold: 1, isPercent: true },
];

const MIN_GRADE_GOAL = 7;

export const TrophiesPanel = () => {
  const subjects = useAcademicStore((state) => state.subjects);

  const stats = useMemo(() => {
    const total = subjects.length;
    const approved = subjects.filter((subject) => subject.status === SubjectStatus.APROBADA);
    const approvedCount = approved.length;
    const hasHighGrade = subjects.some((subject) => (subject.grade ?? 0) >= MIN_GRADE_GOAL);
    const avgGrade = approved.length
      ? approved.reduce((sum, subject) => sum + (subject.grade ?? 0), 0) / approved.length
      : 0;
    const progress = total > 0 ? approvedCount / total : 0;
    return { approvedCount, avgGrade, progress, hasHighGrade };
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
              : stats.approvedCount >= trophy.threshold;

          return (
            <div
              key={trophy.id}
              className={`rounded-2xl border p-4 shadow-subtle ${
                achieved ? 'border-accent bg-surface' : 'border-app bg-elevated'
              }`}
            >
              <p className="text-xs uppercase tracking-widest text-muted">{trophy.label}</p>
              <h4 className="text-lg font-bold text-app">{trophy.description}</h4>
              <p className="text-sm text-muted">
                Estado: {achieved ? 'Desbloqueado' : 'Pendiente'}
              </p>
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
