import { useEffect, useMemo, useState } from 'react';
import { useAcademicStore } from '../academic/store/academic-store';
import { buildEdges, getRecommendationsWithReasons } from '../../shared/lib/graph';
import { fetchAcademicGraph } from '../academic/lib/academic-api';
import { Lock, Unlock, RotateCcw } from 'lucide-react';
import { UnifiedSchedulePlanner } from '../schedule/components/UnifiedSchedulePlanner';
import { fetchTimetables, createTimetable, deleteTimetable } from '../schedule/lib/schedule-api';
import type { TimetableDto, TimePeriod, DayOfWeek } from '../schedule/lib/schedule-api';

const DEFAULT_COUNT = 4;

export const RecommendationsPage = () => {
  const subjects = useAcademicStore((state) => state.subjects);
  const setSubjects = useAcademicStore((state) => state.setSubjects);

  // Recommendations State
  const [desiredCount, setDesiredCount] = useState(DEFAULT_COUNT);
  const [inputValue, setInputValue] = useState(String(DEFAULT_COUNT));
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set());
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  if (loadError) console.error("Page Load Error:", loadError);

  // Schedule State
  const [timetables, setTimetables] = useState<TimetableDto[]>([]);
  const [availability, setAvailability] = useState<Map<string, boolean>>(new Map());

  // Load Data
  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const promises: Promise<any>[] = [];
        if (subjects.length === 0) promises.push(fetchAcademicGraph());
        promises.push(fetchTimetables());

        const results = await Promise.all(promises);

        if (!active) return;

        if (subjects.length === 0) setSubjects(results[0]);
        setTimetables(subjects.length === 0 ? results[1] : results[0]);

        // Load availability from local storage
        const storedAvail = localStorage.getItem('user_availability');
        if (storedAvail) {
          try {
            setAvailability(new Map(JSON.parse(storedAvail)));
          } catch (e) {
            console.error("Failed to parse availability", e);
          }
        }

      } catch (err) {
        if (!active) return;
        const message = err instanceof Error ? err.message : 'Error al cargar datos.';
        console.error("Failed to load data:", message);
        setLoadError(message);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [setSubjects, subjects.length]);

  // Save Availability
  const handleAvailabilityChange = (newMap: Map<string, boolean>) => {
    setAvailability(newMap);
    localStorage.setItem('user_availability', JSON.stringify(Array.from(newMap.entries())));
  };

  // Schedule Actions
  const handleAddTimetable = async (data: { subjectId: string; day: DayOfWeek; period: TimePeriod }) => {
    try {
      const newTimetable = await createTimetable({
        subjectId: data.subjectId,
        dayOfWeek: data.day,
        period: data.period,
      });
      setTimetables(prev => [...prev, newTimetable]);
    } catch (err) {
      alert("Error al guardar horario. Verifica si ya existe.");
    }
  };

  const handleRemoveTimetable = async (subjectId: string) => {
    if (!confirm('¿Eliminar esta materia del horario?')) return;
    try {
      await deleteTimetable(subjectId);
      setTimetables(prev => prev.filter(t => t.subjectId !== subjectId));
    } catch (err) {
      alert("Error al eliminar horario.");
    }
  };

  // Recommendations Logic
  const recommendations = useMemo(() => {
    const edges = buildEdges(subjects);
    return getRecommendationsWithReasons(
      subjects,
      edges,
      desiredCount,
      Array.from(excludedIds)
    );
  }, [subjects, desiredCount, excludedIds]);

  const recommendedIds = useMemo(() => new Set(recommendations.map(r => r.subject.id)), [recommendations]);

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
      } else {
        next.add(subjectId);
        // If locking, ensure it's not excluded
        setExcludedIds((excl) => {
          const nextExcl = new Set(excl);
          nextExcl.delete(subjectId);
          return nextExcl;
        });
      }
      return next;
    });
  };

  const handleToggleExclude = (subjectId: string) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(subjectId)) {
        next.delete(subjectId);
      } else {
        next.add(subjectId);
        // If excluding, ensure it's not locked
        setLockedIds((locked) => {
          const nextLocked = new Set(locked);
          nextLocked.delete(subjectId);
          return nextLocked;
        });
      }
      return next;
    });
  };

  const handleRecalculate = () => {
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
    <section className="space-y-8 max-w-6xl mx-auto pb-20">
      <header>
        <h2 className="text-4xl font-bold text-app font-retro mb-2">Planificador Académico</h2>
        <p className="text-lg text-muted">
          Generá tu plan ideal y organizá tus horarios en un solo lugar.
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

      <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8">
        {/* Left Column: Recommendations */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-app font-retro">
              Sugerencias
            </h3>
            {(lockedIds.size > 0 || excludedIds.size > 0) && (
              <button
                onClick={handleRecalculate}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-unlam-500 text-unlam-500 hover:bg-unlam-500/10 transition-colors font-bold text-xs"
              >
                <RotateCcw size={14} />
                Recalcular
              </button>
            )}
          </div>

          {isLoading && subjects.length === 0 ? (
            <div className="rounded-2xl border-2 border-app-border bg-elevated p-8 text-center">
              <p className="text-muted">Cargando materias...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-2xl border-2 border-app-border bg-elevated p-8 text-center">
              <p className="text-muted">No hay recomendaciones disponibles.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec, index) => {
                const isLocked = lockedIds.has(rec.subject.id);
                const isExcluded = excludedIds.has(rec.subject.id);

                return (
                  <div
                    key={rec.subject.id}
                    className={`rounded-xl border-2 p-4 transition-all ${isLocked
                      ? 'border-unlam-500 bg-unlam-500/10'
                      : isExcluded
                        ? 'border-red-500/50 bg-red-500/5 opacity-60'
                        : 'border-app-border bg-surface hover:border-unlam-500/50'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">
                            Prioridad #{index + 1}
                          </p>
                          <div className="text-xs text-center font-mono font-bold text-unlam-500 bg-app-bg px-2 rounded">
                            Score: {rec.score.toFixed(1)}
                          </div>
                        </div>
                        <h4 className="text-base font-bold text-app mb-1">{rec.subject.name}</h4>
                        <p className="text-[10px] text-muted">Código: {rec.subject.planCode}</p>
                      </div>
                    </div>

                    {/* Reasons */}
                    {rec.reasons.length > 0 && (
                      <div className="space-y-1 mb-3">
                        {rec.reasons.slice(0, 2).map((reason, idx) => (
                          <div key={idx} className="text-xs text-app bg-app-elevated/50 rounded px-2 py-0.5 truncate">
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
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg font-bold text-xs transition-all ${isLocked
                          ? 'bg-unlam-500 text-white hover:bg-unlam-600'
                          : 'border border-unlam-500 text-unlam-500 hover:bg-unlam-500/10'
                          } disabled:opacity-40`}
                      >
                        {isLocked ? <Lock size={12} className="mr-1" /> : <Unlock size={12} className="mr-1" />}
                        {isLocked ? 'Mantenida' : 'Mantener'}
                      </button>
                      <button
                        onClick={() => handleToggleExclude(rec.subject.id)}
                        disabled={isLocked}
                        className={`flex-1 px-2 py-1.5 rounded-lg font-bold text-xs transition-all ${isExcluded
                          ? 'bg-red-500 text-white'
                          : 'border border-red-500/50 text-red-500 hover:bg-red-500/10'
                          } disabled:opacity-40`}
                      >
                        {isExcluded ? 'Descartada' : 'Descartar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Unified Scheduler */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-app font-retro">
              Horario Semanal
            </h3>
          </div>
          <div className="bg-elevated/50 rounded-2xl border border-app p-1">
            <UnifiedSchedulePlanner
              availability={availability}
              timetables={timetables}
              subjects={subjects}
              onAvailabilityChange={handleAvailabilityChange}
              onAddTimetable={handleAddTimetable}
              onRemoveTimetable={handleRemoveTimetable}
              recommendedIds={recommendedIds}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
