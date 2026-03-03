import { cn } from '../../../shared/lib/utils';
import type { DayOfWeek, TimePeriod, TimetableDto } from '../lib/schedule-api';
import { Trash2, Plus } from 'lucide-react';
import type { VisualRow } from '../hooks/useSchedulePlanner';

export const DAYS: { key: DayOfWeek; label: string }[] = [
    { key: 'MONDAY', label: 'Lun' },
    { key: 'TUESDAY', label: 'Mar' },
    { key: 'WEDNESDAY', label: 'Mií' },
    { key: 'THURSDAY', label: 'Jue' },
    { key: 'FRIDAY', label: 'Vie' },
    { key: 'SATURDAY', label: 'Sáb' },
];

interface ScheduleGridProps {
    mode: 'AVAILABILITY' | 'OPTIONS' | 'FINAL';
    availability: Map<string, boolean>;
    rowsForMode: VisualRow[];
    hoveredCell: string | null;
    onMouseDown: (day: string, periodKey: string) => void;
    onMouseEnter: (day: string, periodKey: string) => void;
    onClickCell: (day: DayOfWeek, period: TimePeriod, slotRange: string) => void;
    getCellContent: (day: DayOfWeek, periodKey: string, slotRange: string) => TimetableDto | undefined;
    getCellOffers: (day: DayOfWeek, periodKey: string, slotRange: string) => TimetableDto[];
    colorForSubject: (subjectId: string) => string;
    onRemoveTimetable: (subjectId: string) => Promise<void>;
}

export function ScheduleGrid({
    mode,
    availability,
    rowsForMode,
    hoveredCell,
    onMouseDown,
    onMouseEnter,
    onClickCell,
    getCellContent,
    getCellOffers,
    colorForSubject,
    onRemoveTimetable,
}: ScheduleGridProps) {
    return (
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
                                        <div className="text-[10px] text-amber-600 dark:text-amber-300 font-bold uppercase tracking-wider">No estándar</div>
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
                                            mode === 'AVAILABILITY' && "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5",
                                            mode === 'AVAILABILITY' && isAvailable && "bg-green-500/30 hover:bg-green-500/40 dark:bg-green-500/20 dark:hover:bg-green-500/30",
                                            mode !== 'AVAILABILITY' && !isAvailable && "bg-app-bg opacity-70",
                                            mode === 'OPTIONS' && isAvailable && offersForCell.length > 0 && "cursor-pointer hover:bg-primary/20",
                                            mode === 'OPTIONS' && isAvailable && offersForCell.length === 0 && "bg-app-bg opacity-40"
                                        )}
                                        style={{ height: `${cellMinHeight}px` }}
                                        onMouseDown={() => onMouseDown(day.key, row.period)}
                                        onMouseEnter={() => onMouseEnter(day.key, row.period)}
                                        onClick={() => onClickCell(day.key, row.period, row.slotRange)}
                                    >
                                        {/* Availability Indicator */}
                                        {mode !== 'AVAILABILITY' && isAvailable && !timetableItem && (
                                            <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-green-500/60 shadow-[0_0_4px_rgba(34,197,94,0.6)]" title="Disponible" />
                                        )}

                                        {/* Offer options in step 2 */}
                                        {mode === 'OPTIONS' && offersForCell.length > 0 && (
                                            <div className="absolute inset-0 p-1.5 overflow-hidden">
                                                <div className="text-[10px] font-bold text-primary mb-1">
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
                                            <div className="absolute inset-0 m-1 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-primary/50 rounded-md overflow-hidden group z-10 shadow-sm backdrop-blur-sm transition-transform hover:scale-[1.02]">
                                                <div className="p-2 h-full flex flex-col justify-center">
                                                    <p className="font-bold text-xs md:text-sm text-primary leading-tight line-clamp-2" title={timetableItem.subjectName}>
                                                        {timetableItem.subjectName}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRemoveTimetable(timetableItem.subjectId);
                                                    }}
                                                    className="absolute top-0 right-0 p-1.5 text-destructive opacity-0 group-hover:opacity-100 bg-destructive/60 hover:bg-destructive/90 rounded-bl-lg transition-opacity"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        )}

                                        {/* Add Hint */}
                                        {mode === 'OPTIONS' && offersForCell.length > 0 && (hoveredCell === `${day.key}-${row.period}`) && (
                                            <div className="absolute inset-0 flex items-center justify-center text-primary opacity-40 pointer-events-none">
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
        </div>
    );
}

