import { useEffect, useMemo, useState } from 'react';
import { useAcademicStore } from '../academic/store/academic-store';
import { buildEdges, getRecommendationsWithReasons } from '../../shared/lib/graph';
import { fetchAcademicGraph } from '../academic/lib/academic-api';
import { Lock, Unlock, RotateCcw, Calendar, List, Wand2 } from 'lucide-react';
import { UnifiedSchedulePlanner } from '../schedule/components/UnifiedSchedulePlanner';
import { fetchTimetables, createTimetable, deleteTimetable } from '../schedule/lib/schedule-api';
import type { TimetableDto, TimePeriod, DayOfWeek } from '../schedule/lib/schedule-api';

const DEFAULT_COUNT = 4;

type ViewMode = 'CALENDAR' | 'LIST';

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

  const [viewMode, setViewMode] = useState<ViewMode>('CALENDAR');

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

  const handleAutoComplete = async () => {
    const availableSlots = Array.from(availability.entries())
      .filter(([_, isAvail]) => isAvail)
      .map(([key]) => {
        const [day, period] = key.split('-');
        return { day: day as DayOfWeek, period: period as TimePeriod };
      });

    const emptySlots = availableSlots.filter(
      slot => !timetables.some(t => t.dayOfWeek === slot.day && t.period === slot.period)
    );

    if (emptySlots.length === 0) {
      alert("No hay horarios disponibles configurados en la pestaña 'Definir Disponibilidad' que estén vacíos.");
      return;
    }

    const unassignedRecommendations = recommendations.filter(
      r => !timetables.some(t => t.subjectId === r.subject.id)
    );

    if (unassignedRecommendations.length === 0) {
      alert("Todas las materias clave ya están asignadas.");
      return;
    }

    let addedCount = 0;
    for (const rec of unassignedRecommendations) {
      if (emptySlots.length === 0) break; // no more space
      const slot = emptySlots.shift()!; // take first empty slot
      try {
        const newTimetable = await createTimetable({
          subjectId: rec.subject.id,
          dayOfWeek: slot.day,
          period: slot.period,
        });
        setTimetables(prev => [...prev, newTimetable]);
        addedCount++;
      } catch (err) {
        console.error("Auto-complete failed for subject", rec.subject.name, err);
      }
    }
    if (addedCount > 0) {
      alert(`Auto-completado exitoso: se asignaron ${addedCount} materias a slots vacíos.`);
    }
  };

  return (
    <section className="space-y-6 max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-bold text-app font-retro mb-2 uppercase tracking-wide">Planificador Académico</h2>
          <p className="text-sm text-muted">
            Generá tu plan ideal y organizá tus horarios estratégicamente sin solapamientos.
          </p>
        </div>

        <div className="flex bg-elevated p-1 rounded-lg border border-app shadow-subtle">
          <button
            onClick={() => setViewMode('CALENDAR')}
            className={`px-4 py-2 flex items-center gap-2 rounded-md text-sm font-bold transition-all ${viewMode === 'CALENDAR'
              ? 'bg-unlam-500 text-app-accent-ink shadow-sm'
              : 'text-muted hover:text-app'
              }`}
          >
            <Calendar size={18} /> Calendario Visual
          </button>
          <button
            onClick={() => setViewMode('LIST')}
            className={`px-4 py-2 flex items-center gap-2 rounded-md text-sm font-bold transition-all ${viewMode === 'LIST'
              ? 'bg-unlam-500 text-app-accent-ink shadow-sm'
              : 'text-muted hover:text-app'
              }`}
          >
            <List size={18} /> Materias Clave
          </button>
        </div>
      </header>

      {/* Input Section */}
      <div className="rounded-xl border border-app bg-surface p-5 shadow-subtle">
        <label htmlFor="count-input" className="block text-xs font-bold text-muted mb-2 uppercase tracking-wider">
          ¿Cuántas materias querés cursar?
        </label>
        <div className="flex gap-3 max-w-sm">
          <input
            id="count-input"
            type="number"
            min="1"
            max="10"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg border-2 border-app bg-app-bg text-app font-mono text-lg focus:outline-none focus:ring-2 focus:ring-unlam-500/50 transition-all text-center"
            placeholder="Ej: 4"
          />
          <button
            onClick={handleGeneratePlan}
            className="px-6 py-2.5 rounded-lg bg-unlam-500 text-black font-bold uppercase tracking-wider shadow-subtle hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            Sugerir
          </button>
        </div>
      </div>

      <div className={`grid gap-8 ${viewMode === 'CALENDAR' ? 'lg:grid-cols-[1.5fr_2fr]' : 'lg:grid-cols-1 max-w-3xl mx-auto'}`}>
        {/* Left Column: Recommendations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-app pb-2">
            <h3 className="text-xl font-bold text-app uppercase tracking-wide">
              {viewMode === 'CALENDAR' ? 'Sugerencias' : 'Lista de Materias Clave'}
            </h3>
            {(lockedIds.size > 0 || excludedIds.size > 0) && (
              <button
                onClick={handleRecalculate}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-unlam-500 text-unlam-500 hover:bg-unlam-500/10 transition-colors font-bold text-xs"
              >
                <RotateCcw size={14} />
                Recalcular
              </button>
            )}
          </div>

          {isLoading && subjects.length === 0 ? (
            <div className="rounded-xl border border-app bg-elevated p-8 text-center">
              <p className="text-muted font-mono animate-pulse">Analizando correlativas...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-xl border border-app bg-elevated p-8 text-center">
              <p className="text-muted">No hay recomendaciones disponibles para tu estado actual.</p>
            </div>
          ) : (
            <div className={`grid gap-4 ${viewMode === 'LIST' ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
              {recommendations.map((rec, index) => {
                const isLocked = lockedIds.has(rec.subject.id);
                const isExcluded = excludedIds.has(rec.subject.id);
                const isScheduled = timetables.some(t => t.subjectId === rec.subject.id);

                return (
                  <div
                    key={rec.subject.id}
                    className={`rounded-xl border border-app p-4 transition-all shadow-subtle relative overflow-hidden group ${isLocked
                      ? 'border-unlam-500 bg-unlam-500/5'
                      : isExcluded
                        ? 'border-red-500/30 bg-red-500/5 opacity-50 grayscale hover:grayscale-0'
                        : 'bg-surface hover:border-unlam-500/50 hover:shadow-md'
                      }`}
                  >
                    {isScheduled && (
                      <div className="absolute top-0 right-0 bg-green-500 text-black text-[9px] font-bold uppercase px-2 py-0.5 rounded-bl-lg tracking-widest z-10">
                        Agendada
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-3 relative z-10">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] text-muted font-bold uppercase tracking-wider">
                            Prioridad #{index + 1}
                          </p>
                          <div className="text-[10px] text-center font-mono font-bold text-unlam-500 bg-app-bg px-2 py-0.5 rounded border border-unlam-500/20">
                            Score: {rec.score.toFixed(1)}
                          </div>
                        </div>
                        <h4 className="text-base font-bold text-app leading-tight mb-1">{rec.subject.name}</h4>
                        <p className="text-[10px] text-muted font-mono bg-app-bg inline-block px-1.5 rounded">Cód: {rec.subject.planCode}</p>
                      </div>
                    </div>

                    {/* Reasons */}
                    {rec.reasons.length > 0 && (
                      <div className="space-y-1.5 mb-4 border-l-2 border-unlam-500/30 pl-2">
                        {rec.reasons.map((reason, idx) => (
                          <div key={idx} className="text-[11px] text-app">
                            {reason}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => handleToggleLock(rec.subject.id)}
                        disabled={isExcluded}
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all ${isLocked
                          ? 'bg-unlam-500 text-black'
                          : 'border border-app text-app hover:bg-surface'
                          } disabled:opacity-40`}
                      >
                        {isLocked ? <Lock size={12} className="mr-1" /> : <Unlock size={12} className="mr-1" />}
                        {isLocked ? 'Fijada' : 'Fijar'}
                      </button>
                      <button
                        onClick={() => handleToggleExclude(rec.subject.id)}
                        disabled={isLocked}
                        className={`flex-1 px-2 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all ${isExcluded
                          ? 'bg-red-500/20 text-red-500 border border-red-500/50'
                          : 'border border-app text-app hover:bg-surface'
                          } disabled:opacity-40`}
                      >
                        {isExcluded ? 'Omitida' : 'Omitir'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Unified Scheduler (Only visible in CALENDAR mode) */}
        {viewMode === 'CALENDAR' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-app pb-2">
              <div>
                <h3 className="text-xl font-bold text-app uppercase tracking-wide">
                  Grilla Horaria
                </h3>
              </div>

              <button
                onClick={handleAutoComplete}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500 text-blue-400 hover:bg-blue-500/20 transition-all font-bold text-xs shadow-subtle group"
                title="Completar los huecos disponibles con las materias sugeridas"
              >
                <Wand2 size={14} className="group-hover:rotate-12 transition-transform" />
                Auto-Completar
              </button>
            </div>

            <div className="bg-elevated rounded-2xl border border-app shadow-soft">
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
        )}
      </div>
    </section>
  );
};
