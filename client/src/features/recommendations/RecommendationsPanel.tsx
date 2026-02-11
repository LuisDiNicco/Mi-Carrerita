import { useMemo, useState } from 'react';
import { useAcademicStore } from '../academic/store/academic-store';
import { buildEdges, getRecommendations } from '../../shared/lib/graph';
import { RetroButton } from '../../shared/ui/RetroButton';

const DEFAULT_RECOMMEND_COUNT = 4;

export const RecommendationsPanel = () => {
  const subjects = useAcademicStore((state) => state.subjects);
  const [desiredCount, setDesiredCount] = useState(DEFAULT_RECOMMEND_COUNT);
  const [draftCount, setDraftCount] = useState(String(DEFAULT_RECOMMEND_COUNT));

  const recommendations = useMemo(() => {
    const edges = buildEdges(subjects);
    const count = Math.max(1, desiredCount);
    return getRecommendations(subjects, edges, count);
  }, [subjects, desiredCount]);

  const handleApply = () => {
    const parsed = Number(draftCount);
    const next = Number.isNaN(parsed) ? DEFAULT_RECOMMEND_COUNT : Math.max(1, parsed);
    setDesiredCount(next);
    setDraftCount(String(next));
  };

  return (
    <section className="rounded-2xl border border-app bg-elevated p-4 shadow-subtle">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-app">Recomendaciones de cursada</h3>
          <p className="text-sm text-muted">Prioriza materias claves para avanzar mas rapido.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            className="w-20 bg-surface border border-app rounded-lg px-3 py-2 text-app"
            value={draftCount}
            onChange={(event) => setDraftCount(event.target.value)}
          />
          <RetroButton variant="primary" size="sm" onClick={handleApply}>
            Aplicar
          </RetroButton>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <p className="text-sm text-muted">No hay materias disponibles para recomendar.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {recommendations.map((subject) => (
            <div
              key={subject.id}
              className="rounded-xl border border-app bg-surface px-4 py-3 shadow-subtle"
            >
              <p className="text-xs text-muted">Codigo {subject.planCode}</p>
              <p className="text-base font-semibold text-app">{subject.name}</p>
              <p className="text-xs text-muted">Cuatrimestre {subject.semester}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
