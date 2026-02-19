import { useState, useRef, useEffect } from 'react';
import { cn } from '../../../shared/lib/utils';
import type { DayOfWeek, TimePeriod, TimetableDto } from '../lib/schedule-api';
import { Trash2, Plus } from 'lucide-react';
import type { Subject } from '../../../shared/types/academic';

interface UnifiedSchedulePlannerProps {
    availability: Map<string, boolean>;
    timetables: TimetableDto[];
    subjects: Subject[];
    onAvailabilityChange: (data: Map<string, boolean>) => void;
    onAddTimetable: (data: { subjectId: string; day: DayOfWeek; period: TimePeriod }) => Promise<void>;
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

const PERIODS: { key: TimePeriod; label: string }[] = [
    { key: 'M1', label: '08:00' },
    { key: 'M2', label: '09:00' },
    { key: 'M3', label: '10:00' },
    { key: 'M4', label: '11:00' },
    { key: 'M5', label: '12:00' },
    { key: 'M6', label: '13:00' },
    { key: 'T1', label: '14:00' },
    { key: 'T2', label: '15:00' },
    { key: 'T3', label: '16:00' },
    { key: 'T4', label: '17:00' },
    { key: 'T5', label: '18:00' },
    { key: 'T6', label: '19:00' },
    { key: 'N1', label: '20:00' },
    { key: 'N2', label: '21:00' },
    { key: 'N3', label: '22:00' },
    { key: 'N4', label: '23:00' },
];

export const UnifiedSchedulePlanner = ({
    availability,
    timetables,
    subjects,
    onAvailabilityChange,
    onAddTimetable,
    onRemoveTimetable,
    recommendedIds
}: UnifiedSchedulePlannerProps) => {
    const [mode, setMode] = useState<'AVAILABILITY' | 'SCHEDULE'>('AVAILABILITY');
    const [hoveredCell, setHoveredCell] = useState<string | null>(null);

    // Availability dragging state
    const isDragging = useRef(false);
    const dragMode = useRef<'add' | 'remove'>('add');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [targetCell, setTargetCell] = useState<{ day: DayOfWeek, period: TimePeriod } | null>(null);
    const [selectedSubjectId, setSelectedSubjectId] = useState('');

    // 1. Availability Handlers
    const toggleAvailability = (day: string, periodIndex: number) => {
        if (mode !== 'AVAILABILITY') return;
        // Map periodIndex 0..15 to generic "hour"? 
        // We used generic hours in AvailabilityGrid but PERIODS keys here.
        // Let's use the PERIOD KEY as the identifier for availability too.
        const periodKey = PERIODS[periodIndex].key;
        const key = `${day}-${periodKey}`;

        // Update availability map
        const newMap = new Map(availability);
        if (dragMode.current === 'add') {
            newMap.set(key, true);
        } else {
            newMap.delete(key);
        }
        onAvailabilityChange(newMap);
    };

    const handleMouseDown = (day: string, periodIndex: number) => {
        if (mode !== 'AVAILABILITY') return;
        isDragging.current = true;
        const periodKey = PERIODS[periodIndex].key;
        const key = `${day}-${periodKey}`;
        dragMode.current = availability.has(key) ? 'remove' : 'add';
        toggleAvailability(day, periodIndex);
    };

    const handleMouseEnter = (day: string, periodIndex: number) => {
        setHoveredCell(`${day}-${periodIndex}`);
        if (mode === 'AVAILABILITY' && isDragging.current) {
            toggleAvailability(day, periodIndex);
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
    const handleCellClick = (day: DayOfWeek, period: TimePeriod) => {
        if (mode !== 'SCHEDULE') return;
        // If occupied, maybe show details? For now nothing or delete
        const existing = timetables.find(t => t.dayOfWeek === day && t.period === period);
        if (existing) return; // Maybe click to delete?

        setTargetCell({ day, period });
        setSelectedSubjectId('');
        setIsModalOpen(true);
    };

    const confirmAddClass = async () => {
        if (!targetCell || !selectedSubjectId) return;
        await onAddTimetable({
            subjectId: selectedSubjectId,
            day: targetCell.day,
            period: targetCell.period
        });
        setIsModalOpen(false);
    };

    // Helper
    const getCellContent = (day: DayOfWeek, periodKey: TimePeriod) => {
        return timetables.find(t => t.dayOfWeek === day && t.period === periodKey);
    };

    // Sorted subjects: Recommended first, then alphabetical
    const sortedSubjects = [...subjects].sort((a, b) => {
        const aRec = recommendedIds.has(a.id);
        const bRec = recommendedIds.has(b.id);
        if (aRec && !bRec) return -1;
        if (!aRec && bRec) return 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex bg-elevated p-1 rounded-lg border border-app w-fit">
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
                    onClick={() => setMode('SCHEDULE')}
                    className={cn(
                        "px-4 py-2 rounded-md text-sm font-bold transition-all",
                        mode === 'SCHEDULE'
                            ? "bg-blue-500 text-white shadow-sm"
                            : "text-muted hover:text-app"
                    )}
                >
                    2. Armar Horario
                </button>
            </div>

            <div className="select-none bg-elevated rounded-xl border border-app shadow-sm overflow-hidden overflow-x-auto relative">
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2 border-b border-r border-app bg-surface text-center min-w-[50px] text-muted">Hora</th>
                            {DAYS.map(day => (
                                <th key={day.key} className="p-2 border-b border-app bg-surface text-center min-w-[100px] text-app font-bold">
                                    {day.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {PERIODS.map((period, pIdx) => (
                            <tr key={period.key}>
                                <td className="p-2 border-r border-b border-app/50 font-mono text-muted text-center bg-surface/50">
                                    {period.label}
                                </td>
                                {DAYS.map((day) => {
                                    const key = `${day.key}-${period.key}`;
                                    const isAvailable = availability.get(key);
                                    const timetableItem = getCellContent(day.key, period.key);

                                    return (
                                        <td
                                            key={key}
                                            className={cn(
                                                "p-0 border-b border-r border-app/30 align-top h-12 relative transition-colors duration-75",
                                                mode === 'AVAILABILITY' && "cursor-pointer hover:bg-white/5",
                                                mode === 'AVAILABILITY' && isAvailable && "bg-green-500/20 hover:bg-green-500/30",
                                                mode === 'SCHEDULE' && !isAvailable && "bg-black/20", // Dim unavailable slots in schedule mode
                                                mode === 'SCHEDULE' && !timetableItem && "cursor-pointer hover:bg-blue-500/10"
                                            )}
                                            onMouseDown={() => handleMouseDown(day.key, pIdx)}
                                            onMouseEnter={() => handleMouseEnter(day.key, pIdx)}
                                            onClick={() => handleCellClick(day.key, period.key)}
                                        >
                                            {/* Availability Indicator (Tiny dot if in Schedule Mode) */}
                                            {mode === 'SCHEDULE' && isAvailable && !timetableItem && (
                                                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-green-500/50" title="Disponible" />
                                            )}

                                            {/* Schedule Item */}
                                            {timetableItem && (
                                                <div className="absolute inset-0 m-0.5 bg-blue-500/20 border border-blue-500/50 rounded overflow-hidden group z-10">
                                                    <div className="p-1 h-full flex flex-col justify-center">
                                                        <p className="font-bold text-[10px] md:text-xs text-blue-200 leading-tight truncate" title={timetableItem.subjectName}>
                                                            {timetableItem.subjectName}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onRemoveTimetable(timetableItem.subjectId);
                                                        }}
                                                        className="absolute top-0 right-0 p-1 text-red-400 opacity-0 group-hover:opacity-100 bg-black/50 hover:bg-black/80 rounded-bl transition-opacity"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Add Hint */}
                                            {mode === 'SCHEDULE' && !timetableItem && (hoveredCell === `${day.key}-${pIdx}`) && (
                                                <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                                                    <Plus size={16} />
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-surface border border-app rounded-xl p-6 w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95">
                            <h3 className="text-xl font-bold text-app mb-4">Agregar Materia al Horario</h3>
                            <p className="text-sm text-muted mb-4">
                                {DAYS.find(d => d.key === targetCell?.day)?.label} - {PERIODS.find(p => p.key === targetCell?.period)?.label}
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-muted mb-1">Materia</label>
                                    <select
                                        className="w-full bg-app-bg border border-app rounded-lg px-3 py-2 text-app"
                                        value={selectedSubjectId}
                                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                                        size={10} // Show list
                                    >
                                        <option value="" disabled>Seleccionar materia...</option>
                                        {sortedSubjects.map(s => (
                                            <option key={s.id} value={s.id} className={cn(
                                                "py-1",
                                                recommendedIds.has(s.id) ? "font-bold text-unlam-500" : ""
                                            )}>
                                                {recommendedIds.has(s.id) ? "★ " : ""}{s.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-muted mt-1">* Las materias recomendadas aparecen con estrella.</p>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-sm text-muted hover:text-app"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmAddClass}
                                        disabled={!selectedSubjectId}
                                        className="px-4 py-2 bg-unlam-500 text-black font-bold rounded-lg hover:bg-unlam-600 disabled:opacity-50"
                                    >
                                        Agregar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="text-xs text-muted text-center pt-2">
                {mode === 'AVAILABILITY'
                    ? 'Arrastra para marcar tu disponibilidad (Verde = Disponible).'
                    : 'Haz clic en una celda vacía para agregar una materia. Solo materias recomendadas o disponibles.'}
            </div>
        </div>
    );
};
