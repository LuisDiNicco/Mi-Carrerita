import { Star } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import type { DayOfWeek, TimePeriod, TimetableDto } from '../lib/schedule-api';
import { DAYS } from './ScheduleGrid';

interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetCell: { day: DayOfWeek; period: TimePeriod; slotRange: string } | null;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    filteredModalSubjects: TimetableDto[];
    recommendedIds: Set<string>;
    selectedOfferId: string;
    setSelectedOfferId: (id: string) => void;
    confirmAddClass: () => Promise<void>;
}

export function ScheduleModal({
    isOpen,
    onClose,
    targetCell,
    searchQuery,
    setSearchQuery,
    filteredModalSubjects,
    recommendedIds,
    selectedOfferId,
    setSelectedOfferId,
    confirmAddClass,
}: ScheduleModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-surface border-2 border-app rounded-xl p-0 w-full max-w-xl shadow-retro scale-100 animate-in zoom-in-95 overflow-hidden">
                <div className="bg-elevated p-5 border-b border-app">
                    <h3 className="text-xl font-bold text-app font-retro tracking-wide">Asignar Materia</h3>
                    <p className="text-sm text-muted mt-1 font-mono">
                        {DAYS.find(d => d.key === targetCell?.day)?.label} - {targetCell?.slotRange ?? ''}
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-muted mb-2 uppercase tracking-wide">Seleccionar opción de oferta</label>
                        <input
                            type="text"
                            placeholder="Buscar opción..."
                            className="w-full bg-app-bg border border-app rounded-t-lg px-3 py-2 text-sm focus:ring-1 focus:ring-unlam-500 outline-none mb-1 text-app"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="max-h-56 overflow-y-auto w-full bg-app-bg border border-app rounded-b-lg scrollbar-thin scrollbar-thumb-unlam-500/50">
                            {filteredModalSubjects.length === 0 && (
                                <div className="p-4 text-center text-muted text-sm italic">
                                    No hay opciones de oferta para esta celda.
                                </div>
                            )}
                            {filteredModalSubjects.map((option) => {
                                const isRecommended = recommendedIds.has(option.subjectId);
                                const isSelected = selectedOfferId === option.id;
                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => setSelectedOfferId(option.id)}
                                        className={cn(
                                            "w-full text-left p-3 border-b border-app/20 flex flex-col gap-1 transition-all last:border-b-0",
                                            isSelected ? "bg-unlam-500/20 shadow-inner" : "hover:bg-surface",
                                            isRecommended && !isSelected ? "bg-unlam-500/5" : ""
                                        )}
                                    >
                                        <span className={cn(
                                            "font-bold text-sm md:text-base leading-tight flex items-center gap-1",
                                            isRecommended ? "text-unlam-500" : "text-app"
                                        )}>
                                            {isRecommended && <Star size={14} className="fill-unlam-500" />}{option.subjectName}
                                        </span>
                                        <span className="text-xs text-muted font-mono">
                                            {option.planCode} · {option.slotRange ?? option.period} · Comisión {option.commission ?? '-'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[10px] text-muted mt-2 block">* Las materias "estrella" son recomendadas por tu historial.</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-app-border/40">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold text-muted border border-transparent hover:border-app rounded-lg transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmAddClass}
                            disabled={!selectedOfferId}
                            className="px-6 py-2 bg-unlam-500 text-black font-bold tracking-widest rounded-lg hover:bg-unlam-600 disabled:opacity-50 disabled:grayscale transition-all shadow-subtle hover:shadow-md"
                        >
                            Sumar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

