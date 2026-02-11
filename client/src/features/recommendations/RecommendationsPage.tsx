import { useMemo } from 'react';
import { useAcademicStore } from '../academic/store/academic-store';
import { buildEdges, buildUnlockMap, getRecommendations } from '../../shared/lib/graph';
import { SubjectStatus } from '../../shared/types/academic';

const PRIMARY_COUNT = 4;
const PLAN_B_COUNT = 3;
const PLAN_C_COUNT = 3;

export const RecommendationsPage = () => {
  const subjects = useAcademicStore((state) => state.subjects);

  const { primary, planB, planC, unlocks } = useMemo(() => {
    const edges = buildEdges(subjects);
    const unlocks = buildUnlockMap(edges);
    const primary = getRecommendations(subjects, edges, PRIMARY_COUNT);
    const remaining = subjects.filter(
      (subject) =>
        subject.status === SubjectStatus.DISPONIBLE &&
        !primary.some((item) => item.id === subject.id)
    );
    const planB = remaining.slice(0, PLAN_B_COUNT);
    const planC = remaining.slice(PLAN_B_COUNT, PLAN_B_COUNT + PLAN_C_COUNT);
    return { primary, planB, planC, unlocks };
  }, [subjects]);

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-app">Recomendaciones de cursada</h2>
        <p className="text-base text-muted">
          Sugerencias basadas en correlatividades y avance, con alternativas por si no podes cursar.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-app bg-elevated p-4 shadow-subtle">
          <h3 className="text-lg font-bold text-app mb-3">Plan A (prioridad alta)</h3>
          {primary.length === 0 ? (
            <p className="text-sm text-muted">No hay materias disponibles para recomendar.</p>
          ) : (
            <div className="space-y-3">
              {primary.map((subject, index) => (
                <div key={subject.id} className="rounded-xl border border-app bg-surface px-4 py-3">
                  <p className="text-xs text-muted">Prioridad {index + 1}</p>
                  <p className="text-base font-semibold text-app">{subject.name}</p>
                  <p className="text-xs text-muted">Codigo {subject.planCode}</p>
                  <p className="text-xs text-muted">
                    Desbloquea {unlocks.get(subject.id) ?? 0} materias
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-app bg-elevated p-4 shadow-subtle">
          <h3 className="text-lg font-bold text-app mb-3">Plan B (alternativas)</h3>
          {planB.length === 0 ? (
            <p className="text-sm text-muted">No hay alternativas disponibles.</p>
          ) : (
            <div className="space-y-3">
              {planB.map((subject) => (
                <div key={subject.id} className="rounded-xl border border-app bg-surface px-4 py-3">
                  <p className="text-base font-semibold text-app">{subject.name}</p>
                  <p className="text-xs text-muted">Codigo {subject.planCode}</p>
                  <p className="text-xs text-muted">
                    Desbloquea {unlocks.get(subject.id) ?? 0} materias
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-app bg-elevated p-4 shadow-subtle">
          <h3 className="text-lg font-bold text-app mb-3">Plan C (respaldo)</h3>
          {planC.length === 0 ? (
            <p className="text-sm text-muted">No hay mas alternativas disponibles.</p>
          ) : (
            <div className="space-y-3">
              {planC.map((subject) => (
                <div key={subject.id} className="rounded-xl border border-app bg-surface px-4 py-3">
                  <p className="text-base font-semibold text-app">{subject.name}</p>
                  <p className="text-xs text-muted">Codigo {subject.planCode}</p>
                  <p className="text-xs text-muted">
                    Desbloquea {unlocks.get(subject.id) ?? 0} materias
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
