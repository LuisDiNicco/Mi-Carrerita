import { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '../../../shared/lib/utils';
import type { DayOfWeek, TimePeriod, TimetableDto } from '../lib/schedule-api';
import { Trash2, Plus } from 'lucide-react';

interface UnifiedSchedulePlannerProps {
    availability: Map<string, boolean>;
    timetables: TimetableDto[];
    offerEntries: TimetableDto[];
    onAvailabilityChange: (data: Map<string, boolean>) => void;
    onAddTimetable: (data: {
        subjectId: string;
        day: DayOfWeek;
        period: TimePeriod;
        slotRange?: string;
        durationHours?: number;
        commission?: string;
    }) => Promise<void>;
    onRemoveTimetable: (subjectId: string) => Promise<void>;
    recommendedIds: Set<string>;
}

const DAYS: { key: DayOfWeek; label: string }[] = [
    { key: 'MONDAY', label: 'Lun' },
    { key: 'TUESDAY', label: 'Mar' },
    { key: 'WEDNESDAY', label: 'Mié' },
    { key: 'THURSDAY', label: 'Jue' },
    { key: 'FRIDAY', label: 'Vie' },
    { key: 'SATURDAY', label: 'Sáb' },
];

const PERIODS_4H: Array<{ key: TimePeriod; label: string; slotRange: string; durationHours: number }> = [
    { key: 'M1', label: '08:00 - 12:00 (Mañana)', slotRange: '08a12', durationHours: 4 },
    { key: 'T1', label: '14:00 - 18:00 (Tarde)', slotRange: '14a18', durationHours: 4 },
    { key: 'N1', label: '19:00 - 23:00 (Noche)', slotRange: '19a23', durationHours: 4 },
];

type VisualRow = {
    id: string;
    period: TimePeriod;
    slotRange: string;
    durationHours: number;
    label: string;
    isCanonical: boolean;
};

export const UnifiedSchedulePlanner = ({
    availability,
    timetables,
    offerEntries,
    onAvailabilityChange,
    onAddTimetable,
    onRemoveTimetable,
    recommendedIds
}: UnifiedSchedulePlannerProps) => {
    const [mode, setMode] = useState<'AVAILABILITY' | 'OPTIONS' | 'FINAL'>('AVAILABILITY');
    const [hoveredCell, setHoveredCell] = useState<string | null>(null);

    // Availability dragging state
    const isDragging = useRef(false);
    const dragMode = useRef<'add' | 'remove'>('add');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [targetCell, setTargetCell] = useState<{ day: DayOfWeek, period: TimePeriod, slotRange: string } | null>(null);
    const [selectedOfferId, setSelectedOfferId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Normalize periods map for 4h chunks
    const normalizePeriod = (period: string) => {
        if (period.startsWith('M')) return 'M1';
        if (period.startsWith('T')) return 'T1';
        if (period.startsWith('N')) return 'N1';
        return period;
    };

    const parseSlotRange = (slotRange?: string): { start: number; end: number } | null => {
        if (!slotRange) return null;
        const match = slotRange.match(/^(\d{2})a(\d{2})$/);
        if (!match) return null;

        const start = Number(match[1]);
        const end = Number(match[2]);
        if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;

        return { start, end };
    };

    const detectPeriodFromRange = (slotRange?: string): TimePeriod => {
        const parsed = parseSlotRange(slotRange);
        if (!parsed) return 'M1';
        if (parsed.start < 12) return 'M1';
        if (parsed.start < 19) return 'T1';
        return 'N1';
    };

    const formatRangeLabel = (slotRange: string) => {
        const parsed = parseSlotRange(slotRange);
        if (!parsed) return slotRange;
        return `${parsed.start.toString().padStart(2, '0')}:00 - ${parsed.end
            .toString()
            .padStart(2, '0')}:00`;
    };

    const dynamicRows = useMemo<VisualRow[]>(() => {
        const canonicalRows: VisualRow[] = PERIODS_4H.map((period) => ({
            id: period.slotRange,
            period: period.key,
            slotRange: period.slotRange,
            durationHours: period.durationHours,
            label: period.label,
            isCanonical: true,
        }));

        const canonicalRangeSet = new Set(canonicalRows.map((row) => row.slotRange));
        const extraByRange = new Map<string, VisualRow>();

        for (const offer of offerEntries) {
            if (offer.isRemote || !offer.slotRange) continue;
            if (canonicalRangeSet.has(offer.slotRange)) continue;

            const parsed = parseSlotRange(offer.slotRange);
            if (!parsed) continue;

            if (!extraByRange.has(offer.slotRange)) {
                extraByRange.set(offer.slotRange, {
                    id: `range-${offer.slotRange}`,
                    period: detectPeriodFromRange(offer.slotRange),
                    slotRange: offer.slotRange,
                    durationHours: offer.durationHours ?? Math.max(1, parsed.end - parsed.start),
                    label: `${formatRangeLabel(offer.slotRange)} (Oferta)`,
                    isCanonical: false,
                });
            }
        }

        const allRows = [...canonicalRows, ...Array.from(extraByRange.values())];

        allRows.sort((left, right) => {
            const leftRange = parseSlotRange(left.slotRange);
            const rightRange = parseSlotRange(right.slotRange);
            const leftStart = leftRange?.start ?? 99;
            const rightStart = rightRange?.start ?? 99;
            if (leftStart !== rightStart) return leftStart - rightStart;

            const leftEnd = leftRange?.end ?? 99;
            const rightEnd = rightRange?.end ?? 99;
            return leftEnd - rightEnd;
        });

        return allRows;
    }, [offerEntries]);

    const rowsForMode = mode === 'AVAILABILITY'
        ? dynamicRows.filter((row) => row.isCanonical)
        : dynamicRows;

    // 1. Availability Handlers
    const toggleAvailability = (day: string, periodKey: string) => {
        if (mode !== 'AVAILABILITY') return;
        const key = `${day}-${periodKey}`;

        const newMap = new Map(availability);
        if (dragMode.current === 'add') {
            newMap.set(key, true);
        } else {
            newMap.delete(key);
        }
        onAvailabilityChange(newMap);
    };

    const handleMouseDown = (day: string, periodKey: string) => {
        if (mode !== 'AVAILABILITY') return;
        isDragging.current = true;
        const key = `${day}-${periodKey}`;
        dragMode.current = availability.has(key) ? 'remove' : 'add';
        toggleAvailability(day, periodKey);
    };

    const handleMouseEnter = (day: string, periodKey: string) => {
        setHoveredCell(`${day}-${periodKey}`);
        if (mode === 'AVAILABILITY' && isDragging.current) {
            toggleAvailability(day, periodKey);
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    useEffect(() => {
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);

    // 2. Schedule Handlers
    const handleCellClick = (day: DayOfWeek, period: TimePeriod, slotRange: string) => {
        if (mode !== 'OPTIONS') return;
        const offersForCell = getCellOffers(day, period, slotRange);
        if (offersForCell.length === 0) return;

        setTargetCell({ day, period, slotRange });
        setSelectedOfferId('');
        setIsModalOpen(true);
    };

    const confirmAddClass = async () => {
        if (!targetCell || !selectedOfferId) return;

        const selectedOffer = getCellOffers(targetCell.day, targetCell.period, targetCell.slotRange)
            .find((offer) => offer.id === selectedOfferId);
        if (!selectedOffer) return;

        try {
            await onAddTimetable({
                subjectId: selectedOffer.subjectId,
                day: targetCell.day,
                period: targetCell.period,
                slotRange: selectedOffer.slotRange,
                durationHours: selectedOffer.durationHours,
                commission: selectedOffer.commission,
            });
            setIsModalOpen(false);
        } catch (error) {
            console.error("Conflict checking / saving error:", error);
            // Close modal and let parent handle error display via onAddTimetable's error path
            setIsModalOpen(false);
        }
    };

    // Helper
    const getCellContent = (day: DayOfWeek, periodKey: string, slotRange: string) => {
        return timetables.find((t) => {
            if (t.dayOfWeek !== day) return false;
            if (normalizePeriod(t.period) !== periodKey) return false;

            const rowRange = slotRange || '';
            const timetableRange = t.slotRange || '';
            if (rowRange && timetableRange) return rowRange === timetableRange;

            return rowRange === timetableRange;
        });
    };

    const getCellOffers = (day: DayOfWeek, periodKey: string, slotRange: string) => {
        return offerEntries.filter((offer) => {
            if (offer.isRemote) return false;
            if (offer.dayOfWeek !== day) return false;
            if (normalizePeriod(offer.period) !== periodKey) return false;

            const offerRange = offer.slotRange || '';
            return offerRange === slotRange;
        });
    };

    const colorForSubject = (subjectId: string) => {
        const palette = [
            'bg-blue-500/20 border-blue-500/40 text-blue-100',
            'bg-emerald-500/20 border-emerald-500/40 text-emerald-100',
            'bg-violet-500/20 border-violet-500/40 text-violet-100',
            'bg-amber-500/20 border-amber-500/40 text-amber-100',
            'bg-pink-500/20 border-pink-500/40 text-pink-100',
            'bg-cyan-500/20 border-cyan-500/40 text-cyan-100',
        ];

        let hash = 0;
        for (let index = 0; index < subjectId.length; index += 1) {
            hash = ((hash << 5) - hash) + subjectId.charCodeAt(index);
            hash |= 0;
        }

        return palette[Math.abs(hash) % palette.length];
    };

    const filteredModalSubjects = targetCell
        ? getCellOffers(targetCell.day, targetCell.period, targetCell.slotRange).filter((offer) => {
            const query = searchQuery.toLowerCase();
            return offer.subjectName.toLowerCase().includes(query) || offer.planCode.toLowerCase().includes(query);
        })
        : [];

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex bg-elevated p-1 rounded-lg border border-app w-fit shadow-subtle">
                    <button
                        onClick={() => setMode('AVAILABILITY')}
                        className={cn(
                            "px-4 py-2 rounded-md text-sm font-bold transition-all",
                            mode === 'AVAILABILITY'
                                ? "bg-unlam-500 text-app-accent-ink shadow-sm"
                                : "text-muted hover:text-app"
                        )}
                    >
                        1. Definir Disponibilidad
                    </button>
                    <button
                        onClick={() => setMode('OPTIONS')}
                        className={cn(
                            "px-4 py-2 rounded-md text-sm font-bold transition-all",
                            mode === 'OPTIONS'
                                ? "bg-blue-500 text-white shadow-sm"
                                : "text-muted hover:text-app"
                        )}
                    >
                        2. Elegir desde Oferta
                    </button>
                    <button
                        onClick={() => setMode('FINAL')}
                        className={cn(
                            "px-4 py-2 rounded-md text-sm font-bold transition-all",
                            mode === 'FINAL'
                                ? "bg-indigo-500 text-white shadow-sm"
                                : "text-muted hover:text-app"
                        )}
                    >
                        3. Cursada Elegida
                    </button>
                </div>
            </div>

            <div className="select-none bg-elevated rounded-xl border border-app shadow-soft overflow-hidden relative">
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2 border-b border-r border-app bg-surface text-center text-muted font-bold font-retro">Turno</th>
                            {DAYS.map(day => (
                                <th key={day.key} className="p-2 border-b border-app bg-surface text-center text-app font-bold uppercase tracking-wider">
                                    {day.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rowsForMode.map((row) => (
                            <tr key={row.id}>
                                <td className="p-3 border-r border-b border-app/50 font-mono text-muted text-center bg-surface/50 font-bold">
                                    <div className="space-y-1">
                                        <div>{row.label}</div>
                                        {!row.isCanonical && (
                                            <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">No estándar</div>
                                        )}
                                    </div>
                                </td>
                                {DAYS.map((day) => {
                                    const key = `${day.key}-${row.period}`;
                                    const isAvailable = availability.get(key) || false;
                                    const timetableItem = getCellContent(day.key, row.period, row.slotRange);
                                    const offersForCell = getCellOffers(day.key, row.period, row.slotRange);
                                    const cellMinHeight = Math.max(56, (row.durationHours || 1) * 28);

                                    return (
                                        <td
                                            key={`${key}-${row.slotRange}`}
                                            className={cn(
                                                "p-0 border-b border-r border-app/30 align-top relative transition-colors duration-200",
                                                mode === 'AVAILABILITY' && "cursor-pointer hover:bg-white/5",
                                                mode === 'AVAILABILITY' && isAvailable && "bg-green-500/20 hover:bg-green-500/30",
                                                mode !== 'AVAILABILITY' && !isAvailable && "bg-app-bg",
                                                mode === 'OPTIONS' && isAvailable && offersForCell.length > 0 && "cursor-pointer hover:bg-blue-500/10"
                                            )}
                                            style={{ height: `${cellMinHeight}px` }}
                                            onMouseDown={() => handleMouseDown(day.key, row.period)}
                                            onMouseEnter={() => handleMouseEnter(day.key, row.period)}
                                            onClick={() => handleCellClick(day.key, row.period, row.slotRange)}
                                        >
                                            {/* Availability Indicator */}
                                            {mode !== 'AVAILABILITY' && isAvailable && !timetableItem && (
                                                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-green-500/60 shadow-[0_0_4px_rgba(34,197,94,0.6)]" title="Disponible" />
                                            )}

                                            {/* Offer options in step 2 */}
                                            {mode === 'OPTIONS' && offersForCell.length > 0 && (
                                                <div className="absolute inset-0 p-1.5 overflow-hidden">
                                                    <div className="text-[10px] font-bold text-blue-300 mb-1">
                                                        {offersForCell.length} opción{offersForCell.length > 1 ? 'es' : ''}
                                                    </div>
                                                    <div className="space-y-1">
                                                        {offersForCell.slice(0, 2).map((offer) => (
                                                            <div key={offer.id} className={cn('rounded border px-1.5 py-1 text-[10px] font-bold truncate', colorForSubject(offer.subjectId))}>
                                                                {offer.subjectName}
                                                            </div>
                                                        ))}
                                                        {offersForCell.length > 2 && (
                                                            <div className="text-[10px] text-muted">+{offersForCell.length - 2} más...</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Final selection in step 3 */}
                                            {mode === 'FINAL' && timetableItem && (
                                                <div className="absolute inset-0 m-1 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/50 rounded-md overflow-hidden group z-10 shadow-sm backdrop-blur-sm transition-transform hover:scale-[1.02]">
                                                    <div className="p-2 h-full flex flex-col justify-center">
                                                        <p className="font-bold text-xs md:text-sm text-blue-100 leading-tight line-clamp-2" title={timetableItem.subjectName}>
                                                            {timetableItem.subjectName}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onRemoveTimetable(timetableItem.subjectId);
                                                        }}
                                                        className="absolute top-0 right-0 p-1.5 text-red-300 opacity-0 group-hover:opacity-100 bg-red-900/60 hover:bg-red-900/90 rounded-bl-lg transition-opacity"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Add Hint */}
                                            {mode === 'OPTIONS' && offersForCell.length > 0 && (hoveredCell === `${day.key}-${row.period}`) && (
                                                <div className="absolute inset-0 flex items-center justify-center text-blue-400 opacity-40 pointer-events-none">
                                                    <Plus size={20} />
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Modal */}
                {isModalOpen && (
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
                                                        "font-bold text-sm md:text-base leading-tight",
                                                        isRecommended ? "text-unlam-500" : "text-app"
                                                    )}>
                                                        {isRecommended ? "★ " : ""}{option.subjectName}
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
                                        onClick={() => setIsModalOpen(false)}
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
                )}
            </div>

            <div className="flex justify-center pt-2">
                <p className="text-[11px] bg-surface border border-app px-4 py-2 text-muted shadow-sm md:rounded-full rounded-md text-center max-w-full">
                    {mode === 'AVAILABILITY'
                        ? '🟢 Pulsa o arrastra para marcar disponibilidad.'
                        : mode === 'OPTIONS'
                            ? '📚 En esta etapa puedes ver opciones solapadas de oferta y elegir una por celda.'
                            : '✅ Esta es tu cursada final elegida. Puedes volver al paso 2 para ajustar.'}
                </p>
            </div>
        </div>
    );
};
