import { useState, useMemo } from 'react';
import { useAcademicStore } from '../academic/store/academic-store';
import { buildEdges, getRecommendationsWithReasons, type RecommendationWithReason } from '../../shared/lib/graph';
import { Lock, Unlock, RotateCcw } from 'lucide-react';

const DEFAULT_COUNT = 4;

export const RecommendationsPage = () => {
  const subjects = useAcademicStore((state) => state.subjects);

  const [desiredCount, setDesiredCount] = useState(DEFAULT_COUNT);
  const [inputValue, setInputValue] = useState(String(DEFAULT_COUNT));
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set());
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  const { recommendations, edges } = useMemo(() => {
    const edges = buildEdges(subjects);
    const recommendations = getRecommendationsWithReasons(
      subjects,
      edges,
      desiredCount,
      Array.from(excludedIds)
    );
    return { recommendations, edges };
  }, [subjects, desiredCount, excludedIds]);

  const handleGeneratePlan = () => {
    const count = parseInt(inputValue, 10);
    if (!isNaN(count) && count > 0 && count <= 10) {
      setDesiredCount(count);
      setLockedIds(new Set());
      setExcludedIds(new Set());
    }
  };

  const handleToggleLock = (subjectId: string) => {
    setLockedIds((prev) => {
      const next = new Set(prev);
      if (next.has(subjectId)) {
        next.delete(subjectId);
        setExcludedIds((excl) => {
          const nextExcl = new Set(excl);
          nextExcl.add(subjectId);
          return nextExcl;
        });
      } else {
        next.add(subjectId);
        setExcludedIds((excl) => {
          const nextExcl = new Set(excl);
          nextExcl.delete(subjectId);
          return nextExcl;
        });
      }
      return next;
    });
  };

  const handleRecalculate = () => {
    // Regenerar excluyendo las materias no mantenidas
    const newExcluded = new Set(excludedIds);
    recommendations.forEach((rec) => {
      if (!lockedIds.has(rec.subject.id)) {
        newExcluded.add(rec.subject.id);
      }
    });
    setExcludedIds(newExcluded);
    setLockedIds(new Set());
  };

  return (
    <section className="space-y-8 max-w-5xl mx-auto">
      <header>
        <h2 className="text-4xl font-bold text-app font-retro mb-2">Recomendaciones de Cursada</h2>
        <p className="text-lg text-muted">
          Recibí un plan personalizado basado en prioridades de la carrera
        </p>
      </header>

      {/* Input Section */}
      <div className="rounded-2xl border-2 border-unlam-500/30 bg-surface/80 backdrop-blur-sm p-6 shadow-lg">
        <label htmlFor="count-input" className="block text-sm font-bold text-app mb-3 uppercase tracking-wider">
          ¿Cuántas materias querés cursar?
        </label>
        <div className="flex gap-3">
          <input
            id="count-input"
            type="number"
            min="1"
            max="10"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 px-4 py-3 rounded-lg border-2 border-app-border bg-app-bg text-app font-mono text-lg focus:outline-none focus:ring-2 focus:ring-unlam-500 focus:border-unlam-500 transition-all"
            placeholder="Ej: 4"
          />
          <button
            onClick={handleGeneratePlan}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-unlam-600 to-unlam-500 text-white font-bold hover:scale-105 transition-transform shadow-md hover:shadow-lg"
          >
            Generar Plan
          </button>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length === 0 ? (
        <div className="rounded-2xl border-2 border-app-border bg-elevated p-8 text-center">
          <p className="text-muted text-lg">
            No hay materias disponibles para recomendar en este momento.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-app font-retro">
              Plan A - {recommendations.length} {recommendations.length === 1 ? 'Materia' : 'Materias'}
            </h3>
            {(lockedIds.size > 0 || excludedIds.size > 0) && (
              <button
                onClick={handleRecalculate}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-unlam-500 text-unlam-500 hover:bg-unlam-500/10 transition-colors font-bold"
              >
                <RotateCcw size={18} />
                Recalcular Plan
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {recommendations.map((rec, index) => {
              const isLocked = lockedIds.has(rec.subject.id);
              const isExcluded = excludedIds.has(rec.subject.id);

              return (
                <div
                  key={rec.subject.id}
                  className={`rounded-xl border-2 p-5 transition-all ${isLocked
                      ? 'border-unlam-500 bg-unlam-500/10'
                      : isExcluded
                        ? 'border-red-500/50 bg-red-500/5 opacity-60'
                        : 'border-app-border bg-surface hover:border-unlam-500/50'
                    }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-xs text-muted font-bold uppercase tracking-wider mb-1">
                        Prioridad #{index + 1}
                      </p>
                      <h4 className="text-lg font-bold text-app mb-1">{rec.subject.name}</h4>
                      <p className="text-xs text-muted">Código: {rec.subject.planCode}</p>
                    </div>
                    <div className="flex flex-col gap-2 ml-3">
                      <div className={`text-2xl ${isLocked ? 'text-unlam-500' : 'text-muted'}`}>
                        {isLocked ? '🔒' : '🔓'}
                      </div>
                      <div className="text-xs text-center font-mono font-bold text-unlam-500">
                        {rec.score.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  {/* Reasons */}
                  {rec.reasons.length > 0 && (
                    <div className="space-y-1 mb-4">
                      {rec.reasons.map((reason, idx) => (
                        <div
                          key={idx}
                          className="text-sm text-app bg-app-elevated/50 rounded px-2 py-1"
                        >
                          {reason}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleLock(rec.subject.id)}
                      disabled={isExcluded}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${isLocked
                          ? 'bg-unlam-500 text-white hover:bg-unlam-600'
                          : 'border-2 border-unlam-500 text-unlam-500 hover:bg-unlam-500/10'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                      {isLocked ? 'Mantenida' : 'Mantener'}
                    </button>
                    <button
                      onClick={() => handleToggleLock(rec.subject.id)}
                      disabled={isExcluded}
                      className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all ${isExcluded
                          ? 'bg-red-500 text-white'
                          : 'border-2 border-red-500/50 text-red-500 hover:bg-red-500/10'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {isExcluded ? 'Cambiada' : 'Cambiar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
