import { useEffect, useMemo, useRef, useState } from 'react';
import { useAcademicStore } from '../academic/store/academic-store';
import { buildEdges, getRecommendationsWithReasons } from '../../shared/lib/graph';
import { fetchAcademicGraph } from '../academic/lib/academic-api';
import { Lock, Unlock, RotateCcw, Calendar, List, Wand2, Upload, CheckCircle, AlertTriangle, Info, Plus, Trash2 } from 'lucide-react';
import { UnifiedSchedulePlanner } from '../schedule/components/UnifiedSchedulePlanner';
import { fetchTimetables, uploadOfertaPdf } from '../schedule/lib/schedule-api';
import type { TimetableDto, TimePeriod, DayOfWeek, ParsedTimetableOffer } from '../schedule/lib/schedule-api';
import { SubjectStatus } from '../../shared/types/academic';

const DEFAULT_COUNT = 4;
const MAX_COUNT = 15;

const DAYS_FOR_MANUAL: { key: DayOfWeek; label: string }[] = [
  { key: 'MONDAY', label: 'Lunes' },
  { key: 'TUESDAY', label: 'Martes' },
  { key: 'WEDNESDAY', label: 'Miércoles' },
  { key: 'THURSDAY', label: 'Jueves' },
  { key: 'FRIDAY', label: 'Viernes' },
  { key: 'SATURDAY', label: 'Sábado' },
];

const PERIODS_FOR_MANUAL: { key: TimePeriod; label: string }[] = [
  { key: 'M1', label: 'Mañana (08:00 - 12:00)' },
  { key: 'T1', label: 'Tarde (14:00 - 18:00)' },
  { key: 'N1', label: 'Noche (19:00 - 23:00)' },
];

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
  const [inlineMessage, setInlineMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [scoreInfoOpen, setScoreInfoOpen] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>('CALENDAR');

  // Manual schedule state
  const [manualSubjectId, setManualSubjectId] = useState('');
  const [manualDay, setManualDay] = useState<DayOfWeek>('MONDAY');
  const [manualPeriod, setManualPeriod] = useState<TimePeriod>('M1');

  if (loadError) console.error("Page Load Error:", loadError);

  // Schedule State
  const [timetables, setTimetables] = useState<TimetableDto[]>([]);
  const [availability, setAvailability] = useState<Map<string, boolean>>(new Map());

  // Oferta PDF State
  const ofertaFileRef = useRef<HTMLInputElement>(null);
  const [isUploadingOferta, setIsUploadingOferta] = useState(false);
  const [ofertaData, setOfertaData] = useState<ParsedTimetableOffer[]>([]);
  const [ofertaMessage, setOfertaMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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

        // Load timetables from local storage
        const storedTimetables = localStorage.getItem('user_timetables');
        if (storedTimetables) {
          try {
            setTimetables(JSON.parse(storedTimetables));
          } catch (e) {
            console.error("Failed to parse timetables", e);
            setTimetables(subjects.length === 0 ? results[1] : results[0]);
          }
        } else {
          setTimetables(subjects.length === 0 ? results[1] : results[0]);
        }

        // Load availability from local storage
        const storedAvail = localStorage.getItem('user_availability');
        if (storedAvail) {
          try {
            setAvailability(new Map(JSON.parse(storedAvail)));
          } catch (e) {
            console.error("Failed to parse availability", e);
          }
        }

        // Load oferta from localStorage
        const storedOferta = localStorage.getItem('oferta_materias');
        if (storedOferta) {
          try {
            setOfertaData(JSON.parse(storedOferta));
          } catch (e) {
            console.error("Failed to parse oferta data", e);
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
  const saveTimetablesLocal = (updated: TimetableDto[]) => {
    setTimetables(updated);
    localStorage.setItem('user_timetables', JSON.stringify(updated));
  };

  const handleAddTimetable = async (data: { subjectId: string; day: DayOfWeek; period: TimePeriod }) => {
    if (timetables.some(t => t.dayOfWeek === data.day && t.period === data.period)) {
      setInlineMessage({ text: 'Ya existe una materia asignada en ese turno.', type: 'error' });
      return;
    }

    const subject = subjects.find(s => s.id === data.subjectId);
    const newTimetable: TimetableDto = {
      id: Math.random().toString(36).substring(7),
      subjectId: data.subjectId,
      dayOfWeek: data.day,
      dayLabel: data.day,
      period: data.period,
      subjectName: subject?.name || 'Materia Desconocida',
      planCode: subject?.planCode || '',
    };

    saveTimetablesLocal([...timetables, newTimetable]);
  };

  const handleRemoveTimetable = async (subjectId: string) => {
    saveTimetablesLocal(timetables.filter(t => t.subjectId !== subjectId));
  };

  // Recommendations Logic
  const recommendations = useMemo(() => {
    const edges = buildEdges(subjects);
    return getRecommendationsWithReasons(
      subjects,
      edges,
      desiredCount,
      Array.from(excludedIds),
      timetables,
    );
  }, [subjects, desiredCount, excludedIds, timetables]);

  const recommendedIds = useMemo(() => new Set(recommendations.map(r => r.subject.id)), [recommendations]);

  const handleGeneratePlan = () => {
    const count = parseInt(inputValue, 10);
    if (!isNaN(count) && count > 0 && count <= MAX_COUNT) {
      setDesiredCount(count);
      setLockedIds(new Set());
      setExcludedIds(new Set());
    }
  };

  const handleAddManualTimetable = () => {
    if (!manualSubjectId) return;
    if (timetables.some(t => t.dayOfWeek === manualDay && t.period === manualPeriod)) {
      setInlineMessage({ text: 'Ya existe una materia asignada en ese turno.', type: 'error' });
      return;
    }
    const subject = subjects.find(s => s.id === manualSubjectId);
    const newTimetable: TimetableDto = {
      id: Math.random().toString(36).substring(7),
      subjectId: manualSubjectId,
      dayOfWeek: manualDay,
      dayLabel: DAYS_FOR_MANUAL.find(d => d.key === manualDay)?.label ?? manualDay,
      period: manualPeriod,
      subjectName: subject?.name || 'Materia Desconocida',
      planCode: subject?.planCode || '',
    };
    saveTimetablesLocal([...timetables, newTimetable]);
    setManualSubjectId('');
    setInlineMessage({ text: `Horario agregado: ${subject?.name}`, type: 'success' });
    setTimeout(() => setInlineMessage(null), 3000);
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
      setInlineMessage({ text: "No hay slots disponibles vacíos. Configurá tu disponibilidad en la grilla primero.", type: 'info' });
      return;
    }

    const unassignedRecommendations = recommendations.filter(
      r => !timetables.some(t => t.subjectId === r.subject.id)
    );

    if (unassignedRecommendations.length === 0) {
      setInlineMessage({ text: "Todas las materias recomendadas ya están en el horario.", type: 'info' });
      return;
    }

    const newTimetables = [...timetables];
    let addedCount = 0;
    for (const rec of unassignedRecommendations) {
      if (emptySlots.length === 0) break;
      const slot = emptySlots.shift()!;
      const subject = subjects.find(s => s.id === rec.subject.id);
      newTimetables.push({
        id: Math.random().toString(36).substring(7),
        subjectId: rec.subject.id,
        dayOfWeek: slot.day,
        dayLabel: DAYS_FOR_MANUAL.find(d => d.key === slot.day)?.label ?? slot.day,
        period: slot.period,
        subjectName: subject?.name || 'Materia',
        planCode: subject?.planCode || '',
      });
      addedCount++;
    }

    if (addedCount > 0) {
      saveTimetablesLocal(newTimetables);
      setInlineMessage({ text: `Auto-completado: se asignaron ${addedCount} materia${addedCount > 1 ? 's' : ''} a slots vacíos.`, type: 'success' });
      setTimeout(() => setInlineMessage(null), 4000);
    }
  };

  // Oferta PDF Upload Handler
  const handleOfertaFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsUploadingOferta(true);
    setOfertaMessage(null);
    try {
      const result = await uploadOfertaPdf(file);
      if (result.data.length === 0) {
        setOfertaMessage({ text: 'No se encontraron ofertas. Verificá que el PDF sea válido.', type: 'error' });
        return;
      }
      setOfertaData(result.data);
      localStorage.setItem('oferta_materias', JSON.stringify(result.data));
      setOfertaMessage({ text: `Se cargaron ${result.data.length} horarios desde el PDF.`, type: 'success' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al procesar el PDF.';
      setOfertaMessage({ text: message, type: 'error' });
    } finally {
      setIsUploadingOferta(false);
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

        <div className="flex items-center gap-3">
          <input
            ref={ofertaFileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleOfertaFileSelect}
          />
          <button
            onClick={() => ofertaFileRef.current?.click()}
            disabled={isUploadingOferta}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-unlam-500/50 text-unlam-500 hover:bg-unlam-500/10 hover:border-unlam-500 transition-all font-bold text-sm whitespace-nowrap disabled:opacity-50"
          >
            <Upload size={16} />
            {isUploadingOferta ? 'Procesando...' : 'Subir Oferta (PDF)'}
          </button>

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
        </div>
      </header>

      {/* Oferta Message */}
      {ofertaMessage && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold ${ofertaMessage.type === 'success'
          ? 'bg-green-500/10 border-green-500/30 text-green-500'
          : 'bg-red-500/10 border-red-500/30 text-red-500'
          }`}>
          {ofertaMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {ofertaMessage.text}
          <button onClick={() => setOfertaMessage(null)} className="ml-auto text-muted hover:text-app">×</button>
        </div>
      )}

      {/* Oferta summary */}
      {ofertaData.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-app bg-elevated/50 text-xs text-muted">
          📚 Oferta cargada: <strong className="text-app">{ofertaData.length}</strong> horarios disponibles.
          <button
            onClick={() => { setOfertaData([]); localStorage.removeItem('oferta_materias'); }}
            className="ml-auto text-red-400 hover:text-red-500 text-[10px] font-bold uppercase"
          >
            Limpiar
          </button>
        </div>
      )}

      {/* Input Section */}
      <div className="rounded-xl border border-app bg-surface p-5 shadow-subtle">
        <div className="flex items-start justify-between mb-2 gap-2">
          <label htmlFor="count-input" className="block text-xs font-bold text-muted uppercase tracking-wider">
            ¿Cuántas materias querés cursar?
          </label>
          <button
            onClick={() => setScoreInfoOpen(v => !v)}
            className="flex items-center gap-1 text-[10px] font-bold text-muted hover:text-unlam-500 transition-colors border border-app px-2 py-1 rounded-lg"
          >
            <Info size={12} /> ¿Cómo se calcula el score?
          </button>
        </div>

        {scoreInfoOpen && (
          <div className="mb-3 rounded-lg bg-app-bg border border-app px-4 py-3 text-xs space-y-1.5 text-muted">
            <p className="font-bold text-app text-[11px] uppercase tracking-wider mb-2">Cómo se calcula el score</p>
            <div className="grid gap-1">
              <p><span className="text-unlam-500 font-bold">+200</span> — ⭐ Es "Proyecto Final" (cuando todas las disponibles tienen score 0)</p>
              <p><span className="text-unlam-500 font-bold">+100</span> — 📌 Pertenece al Título Intermedio</p>
              <p><span className="text-unlam-500 font-bold">+80</span>  — 🎯 Desbloquea directamente el Proyecto Final</p>
              <p><span className="text-unlam-500 font-bold">+50</span>  — 🔥 Está en el Camino Crítico de la carrera</p>
              <p><span className="text-unlam-500 font-bold">+10</span>  — 🔓 Por cada materia que desbloquea</p>
              <p><span className="text-unlam-500 font-bold">+10</span>  — 📅 Tiene horario asignado (solo cuando todas llevan score 0)</p>
              <p className="pt-1 border-t border-app-border/30">Desempate: distancia a las materias finales de la carrera.</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 max-w-sm">
          <input
            id="count-input"
            type="number"
            min="1"
            max={MAX_COUNT}
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

      <div className="flex flex-col gap-8 w-full mx-auto">
        {/* Top/Left Section: Recommendations (always visible) */}
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
            <div className={`grid gap-4 sm:grid-cols-2 ${viewMode === 'LIST' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
              {recommendations.map((rec, index) => {
                const isLocked = lockedIds.has(rec.subject.id);
                const isExcluded = excludedIds.has(rec.subject.id);
                const isScheduled = timetables.some(t => t.subjectId === rec.subject.id);

                return (
                  <div
                    key={rec.subject.id}
                    className={`flex flex-col h-full rounded-xl border border-app p-4 transition-all shadow-subtle relative overflow-hidden group ${isLocked
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

        {/* ── Manual Schedule Loading ── */}
        {viewMode === 'CALENDAR' && (
          <div className="space-y-3">
            <div className="border-b border-app pb-2">
              <h3 className="text-xl font-bold text-app uppercase tracking-wide">Cargar Horarios Manualmente</h3>
              <p className="text-xs text-muted mt-1">Alternativa a subir el PDF de oferta. Agrega horarios uno por uno.</p>
            </div>

            {/* Inline message */}
            {inlineMessage && (
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-bold transition-all ${inlineMessage.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : inlineMessage.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                }`}>
                {inlineMessage.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                {inlineMessage.text}
                <button onClick={() => setInlineMessage(null)} className="ml-auto text-muted hover:text-app">×</button>
              </div>
            )}

            <div className="rounded-xl border border-app bg-surface p-4 shadow-subtle">
              <div className="grid gap-3 sm:grid-cols-3 items-end">
                {/* Materia */}
                <label className="flex flex-col gap-1 text-xs font-bold text-muted uppercase tracking-wider">
                  Materia
                  <select
                    className="bg-app-bg border border-app rounded-lg px-3 py-2 text-app text-sm"
                    value={manualSubjectId}
                    onChange={e => setManualSubjectId(e.target.value)}
                  >
                    <option value="">— Seleccionar —</option>
                    {subjects
                      .filter(s => s.status === SubjectStatus.DISPONIBLE || s.status === SubjectStatus.RECURSADA)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                  </select>
                </label>

                {/* Día */}
                <label className="flex flex-col gap-1 text-xs font-bold text-muted uppercase tracking-wider">
                  Día
                  <select
                    className="bg-app-bg border border-app rounded-lg px-3 py-2 text-app text-sm"
                    value={manualDay}
                    onChange={e => setManualDay(e.target.value as DayOfWeek)}
                  >
                    {DAYS_FOR_MANUAL.map(d => (
                      <option key={d.key} value={d.key}>{d.label}</option>
                    ))}
                  </select>
                </label>

                {/* Turno */}
                <label className="flex flex-col gap-1 text-xs font-bold text-muted uppercase tracking-wider">
                  Turno
                  <select
                    className="bg-app-bg border border-app rounded-lg px-3 py-2 text-app text-sm"
                    value={manualPeriod}
                    onChange={e => setManualPeriod(e.target.value as TimePeriod)}
                  >
                    {PERIODS_FOR_MANUAL.map(p => (
                      <option key={p.key} value={p.key}>{p.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleAddManualTimetable}
                  disabled={!manualSubjectId}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-unlam-500 text-black font-bold text-sm disabled:opacity-50 hover:bg-unlam-600 transition-all"
                >
                  <Plus size={14} /> Agregar Horario
                </button>
              </div>

              {/* List of current manual / loaded timetables */}
              {timetables.length > 0 && (
                <div className="mt-4 border-t border-app-border/30 pt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">Horarios cargados ({timetables.length})</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {timetables.map(t => (
                      <div key={t.id} className="flex items-center justify-between px-3 py-1.5 bg-app-bg rounded-lg border border-app/30 text-xs">
                        <span className="font-bold text-app truncate max-w-[60%]">{t.subjectName}</span>
                        <span className="text-muted font-mono">
                          {DAYS_FOR_MANUAL.find(d => d.key === t.dayOfWeek)?.label ?? t.dayOfWeek}
                          {' — '}
                          {PERIODS_FOR_MANUAL.find(p => p.key === t.period)?.label ?? t.period}
                        </span>
                        <button
                          onClick={() => handleRemoveTimetable(t.subjectId)}
                          className="ml-2 text-red-400 hover:text-red-500 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
                title="Completar los huecos disponibles con las materias sugeridas de la lista automáticamente"
              >
                <Wand2 size={14} className="group-hover:rotate-12 transition-transform" />
                Auto-Completar Horario
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
