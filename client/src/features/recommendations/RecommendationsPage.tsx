import { useState } from 'react';
import { useAcademicStore } from '../academic/store/academic-store';
import { Calendar, List, Upload, CheckCircle, AlertTriangle, Info, Plus, Trash2, RotateCcw, Wand2, X, PartyPopper, Star, MapPin, Target, Flame, Key } from 'lucide-react';
import { UnifiedSchedulePlanner } from '../schedule/components/UnifiedSchedulePlanner';
import { SubjectStatus } from '../../shared/types/academic';
import type { TimePeriod, DayOfWeek } from '../schedule/lib/schedule-api';
import { useRecommendations, MAX_COUNT } from './hooks/useRecommendations';
import { useScheduleOffers, DAYS_FOR_MANUAL, PERIODS_FOR_MANUAL } from './hooks/useScheduleOffers';
import { RecommendationCard } from './components/RecommendationCard';

type ViewMode = 'CALENDAR' | 'LIST';

export const RecommendationsPage = () => {
  const subjects = useAcademicStore((state) => state.subjects);
  const [viewMode, setViewMode] = useState<ViewMode>('CALENDAR');

  const {
    isLoading, loadError, inlineMessage, setInlineMessage, timetables, offerEntries, availability,
    ofertaFileRef, isUploadingOferta, ofertaData, setOfertaData, ofertaMessage, setOfertaMessage,
    manualSubjectId, setManualSubjectId, manualDay, setManualDay, manualPeriod, setManualPeriod,
    handleAvailabilityChange, handleAddTimetable, handleRemoveTimetable, handleAddManualTimetable,
    handleAutoComplete, handleOfertaFileSelect, saveOfferEntriesLocal,
  } = useScheduleOffers(subjects);

  const {
    inputValue, setInputValue, lockedIds, excludedIds, scoreInfoOpen, setScoreInfoOpen,
    recommendations, recommendedIds, handleGeneratePlan, handleToggleLock, handleToggleExclude, handleRecalculate,
  } = useRecommendations(subjects, timetables);

  if (loadError) console.error("Page Load Error:", loadError);

  const handleRunAutoComplete = () => {
    handleAutoComplete(recommendations);
  };

  return (
    <section className="space-y-6 max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-bold text-app font-retro mb-2 uppercase tracking-wide">Planificador Académico</h2>
          <p className="text-sm text-muted">Generá tu plan ideal y organizá tus horarios estratégicamente sin solapamientos.</p>
        </div>

        <div className="flex items-center gap-3">
          <input ref={ofertaFileRef} type="file" accept=".pdf" className="hidden" onChange={handleOfertaFileSelect} />
          <button onClick={() => ofertaFileRef.current?.click()} disabled={isUploadingOferta}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-unlam-500/50 text-unlam-500 hover:bg-unlam-500/10 hover:border-unlam-500 transition-all font-bold text-sm whitespace-nowrap disabled:opacity-50">
            <Upload size={16} />{isUploadingOferta ? 'Procesando...' : 'Subir Oferta (PDF)'}
          </button>

          <div className="flex bg-elevated p-1 rounded-lg border border-app shadow-subtle">
            <button onClick={() => setViewMode('CALENDAR')} className={`px-4 py-2 flex items-center gap-2 rounded-md text-sm font-bold transition-all ${viewMode === 'CALENDAR' ? 'bg-unlam-500 text-app-accent-ink shadow-sm' : 'text-muted hover:text-app'}`}>
              <Calendar size={18} /> Calendario Visual
            </button>
            <button onClick={() => setViewMode('LIST')} className={`px-4 py-2 flex items-center gap-2 rounded-md text-sm font-bold transition-all ${viewMode === 'LIST' ? 'bg-unlam-500 text-app-accent-ink shadow-sm' : 'text-muted hover:text-app'}`}>
              <List size={18} /> Materias Clave
            </button>
          </div>
        </div>
      </header>

      {ofertaMessage && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold ${ofertaMessage.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-destructive/10 border-destructive/30 text-destructive'}`}>
          {ofertaMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {ofertaMessage.text}
          <button onClick={() => setOfertaMessage(null)} className="ml-auto text-muted hover:text-app"><X size={14} /></button>
        </div>
      )}

      {ofertaData.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-app bg-elevated/50 text-xs text-muted">
          <PartyPopper size={16} className="text-unlam-500 inline mr-1" /> Oferta cargada: <strong className="text-app">{ofertaData.length}</strong> horarios disponibles.
          <button onClick={() => { setOfertaData([]); localStorage.removeItem('oferta_materias'); }} className="ml-auto text-destructive hover:text-destructive text-[10px] font-bold uppercase">Limpiar</button>
        </div>
      )}

      <div className="rounded-xl border border-app bg-surface p-5 shadow-subtle">
        <div className="flex items-start justify-between mb-2 gap-2">
          <label htmlFor="count-input" className="block text-xs font-bold text-muted uppercase tracking-wider">¿Cuántas materias querés cursar?</label>
          <button onClick={() => setScoreInfoOpen(v => !v)} className="flex items-center gap-1 text-[10px] font-bold text-muted hover:text-unlam-500 transition-colors border border-app px-2 py-1 rounded-lg">
            <Info size={12} /> ¿Cómo se calcula el score?
          </button>
        </div>

        {scoreInfoOpen && (
          <div className="mb-3 rounded-lg bg-app-bg border border-app px-4 py-3 text-xs space-y-1.5 text-muted">
            <p className="font-bold text-app text-[11px] uppercase tracking-wider mb-2">Cómo se calcula el score</p>
            <div className="grid gap-1">
              <p><span className="text-unlam-500 font-bold">+200</span> — <Star size={12} className="inline mr-1 text-yellow-500" /> Es "Proyecto Final"</p>
              <p><span className="text-unlam-500 font-bold">+100</span> — <MapPin size={12} className="inline mr-1 text-red-500" /> Pertenece al Título Intermedio</p>
              <p><span className="text-unlam-500 font-bold">+80</span>  — <Target size={12} className="inline mr-1 text-blue-500" /> Desbloquea directamente el Proyecto Final</p>
              <p><span className="text-unlam-500 font-bold">+50</span>  — <Flame size={12} className="inline mr-1 text-orange-500" /> Está en el Camino Crítico de la carrera</p>
              <p><span className="text-unlam-500 font-bold">+10</span>  — <Key size={12} className="inline mr-1 text-emerald-500" /> Por cada materia que desbloquea</p>
              <p><span className="text-unlam-500 font-bold">+10</span>  — <Calendar size={12} className="inline mr-1 text-purple-500" /> Tiene horario asignado</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 max-w-sm">
          <input id="count-input" type="number" min="1" max={MAX_COUNT} value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="flex-1 px-4 py-2.5 rounded-lg border-2 border-app bg-app-bg text-app font-mono text-lg focus:outline-none focus:ring-2 focus:ring-unlam-500/50 transition-all text-center" placeholder="Ej: 4" />
          <button onClick={handleGeneratePlan} className="px-6 py-2.5 rounded-lg bg-unlam-500 text-black font-bold uppercase tracking-wider shadow-subtle hover:shadow-md hover:-translate-y-0.5 transition-all">Sugerir</button>
        </div>
      </div>

      <div className="flex flex-col gap-8 w-full mx-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-app pb-2">
            <h3 className="text-xl font-bold text-app uppercase tracking-wide">{viewMode === 'CALENDAR' ? 'Sugerencias' : 'Lista de Materias Clave'}</h3>
            {(lockedIds.size > 0 || excludedIds.size > 0) && (
              <button onClick={handleRecalculate} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-unlam-500 text-unlam-500 hover:bg-unlam-500/10 transition-colors font-bold text-xs"><RotateCcw size={14} /> Recalcular</button>
            )}
          </div>

          {isLoading && subjects.length === 0 ? (
            <div className="rounded-xl border border-app bg-elevated p-8 text-center"><p className="text-muted font-mono animate-pulse">Analizando correlativas...</p></div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-xl border border-app bg-elevated p-8 text-center"><p className="text-muted">No hay recomendaciones disponibles para tu estado actual.</p></div>
          ) : (
            <div className={`grid gap-4 sm:grid-cols-2 ${viewMode === 'LIST' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
              {recommendations.map((rec, index) => (
                <RecommendationCard
                  key={rec.subject.id}
                  rec={rec}
                  index={index}
                  isScheduled={timetables.some(t => t.subjectId === rec.subject.id)}
                  isLocked={lockedIds.has(rec.subject.id)}
                  isExcluded={excludedIds.has(rec.subject.id)}
                  onToggleLock={handleToggleLock}
                  onToggleExclude={handleToggleExclude}
                />
              ))}
            </div>
          )}
        </div>

        {viewMode === 'CALENDAR' && (
          <div className="space-y-3">
            <div className="border-b border-app pb-2">
              <h3 className="text-xl font-bold text-app uppercase tracking-wide">Cargar Horarios Manualmente</h3>
            </div>

            {inlineMessage && (
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-bold transition-all ${inlineMessage.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : inlineMessage.type === 'error' ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'bg-primary/10 border-primary/30 text-primary'}`}>
                {inlineMessage.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                {inlineMessage.text}
                <button onClick={() => setInlineMessage(null)} className="ml-auto text-muted hover:text-app"><X size={14} /></button>
              </div>
            )}

            <div className="rounded-xl border border-app bg-surface p-4 shadow-subtle">
              <div className="grid gap-3 sm:grid-cols-3 items-end">
                <label className="flex flex-col gap-1 text-xs font-bold text-muted uppercase tracking-wider">
                  Materia
                  <select className="bg-app-bg border border-app rounded-lg px-3 py-2 text-app text-sm" value={manualSubjectId} onChange={e => setManualSubjectId(e.target.value)}>
                    <option value="">- Seleccionar -</option>
                    {subjects.filter(s => s.status === SubjectStatus.DISPONIBLE || s.status === SubjectStatus.RECURSADA).sort((a, b) => a.name.localeCompare(b.name)).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-bold text-muted uppercase tracking-wider">
                  Día
                  <select className="bg-app-bg border border-app rounded-lg px-3 py-2 text-app text-sm" value={manualDay} onChange={e => setManualDay(e.target.value as DayOfWeek)}>
                    {DAYS_FOR_MANUAL.map(d => (<option key={d.key} value={d.key}>{d.label}</option>))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-bold text-muted uppercase tracking-wider">
                  Turno
                  <select className="bg-app-bg border border-app rounded-lg px-3 py-2 text-app text-sm" value={manualPeriod} onChange={e => setManualPeriod(e.target.value as TimePeriod)}>
                    {PERIODS_FOR_MANUAL.map(p => (<option key={p.key} value={p.key}>{p.label}</option>))}
                  </select>
                </label>
              </div>

              <div className="mt-3 flex justify-end">
                <button onClick={handleAddManualTimetable} disabled={!manualSubjectId} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-unlam-500 text-black font-bold text-sm disabled:opacity-50 hover:bg-unlam-600 transition-all">
                  <Plus size={14} /> Agregar Horario
                </button>
              </div>

              {offerEntries.length > 0 && (
                <div className="mt-4 border-t border-app-border/30 pt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">Oferta cargada ({offerEntries.length})</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {offerEntries.map(t => (
                      <div key={t.id} className="flex items-center justify-between px-3 py-1.5 bg-app-bg rounded-lg border border-app/30 text-xs">
                        <span className="font-bold text-app truncate max-w-[60%]">{t.subjectName}</span>
                        <span className="text-muted font-mono">{t.isRemote ? 'A distancia' : (DAYS_FOR_MANUAL.find(d => d.key === t.dayOfWeek)?.label ?? t.dayOfWeek)} - {t.isRemote ? 'Sin franja fija' : (t.slotRange ?? (PERIODS_FOR_MANUAL.find(p => p.key === t.period)?.label ?? t.period))}</span>
                        <button onClick={() => saveOfferEntriesLocal(offerEntries.filter(entry => entry.id !== t.id))} className="ml-2 text-destructive hover:text-destructive transition-colors" title="Eliminar"><Trash2 size={12} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'CALENDAR' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-app pb-2">
              <h3 className="text-xl font-bold text-app uppercase tracking-wide">Grilla Horaria</h3>
              <button onClick={handleRunAutoComplete} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary text-primary hover:bg-primary/20 transition-all font-bold text-xs shadow-subtle group" title="Completar los huecos disponibles con las materias sugeridas de la lista automáticamente">
                <Wand2 size={14} className="group-hover:rotate-12 transition-transform" /> Auto-Completar Horario
              </button>
            </div>
            <div className="bg-elevated rounded-2xl border border-app shadow-soft">
              <UnifiedSchedulePlanner
                availability={availability}
                timetables={timetables}
                offerEntries={offerEntries}
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

