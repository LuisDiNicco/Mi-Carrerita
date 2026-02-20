import { useState, useRef, useEffect } from 'react';
import { cn } from '../../../shared/lib/utils';
import type { DayOfWeek, TimePeriod, TimetableDto } from '../lib/schedule-api';
import { Trash2, Plus, Grid2X2, Grid3X3 } from 'lucide-react';
import type { Subject } from '../../../shared/types/academic';
import { SubjectStatus } from '../../../shared/types/academic';

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

const PERIODS_2H = [
    { key: 'M1', label: '08:00 - 10:00' },
    { key: 'M3', label: '10:00 - 12:00' },
    { key: 'T1', label: '14:00 - 16:00' },
    { key: 'T3', label: '16:00 - 18:00' },
    { key: 'N1', label: '19:00 - 21:00' },
    { key: 'N3', label: '21:00 - 23:00' },
];

const PERIODS_4H = [
    { key: 'M1', label: '08:00 - 12:00 (Mañana)' },
    { key: 'T1', label: '14:00 - 18:00 (Tarde)' },
    { key: 'N1', label: '19:00 - 23:00 (Noche)' },
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
    const [gridStep, setGridStep] = useState<2 | 4>(4);
    const [hoveredCell, setHoveredCell] = useState<string | null>(null);

    const activePeriods = gridStep === 4 ? PERIODS_4H : PERIODS_2H;

    // Availability dragging state
    const isDragging = useRef(false);
    const dragMode = useRef<'add' | 'remove'>('add');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [targetCell, setTargetCell] = useState<{ day: DayOfWeek, period: TimePeriod } | null>(null);
    const [selectedSubjectId, setSelectedSubjectId] = useState('');

    // Normalize periods map
    const normalizePeriod = (period: string, step: 2 | 4) => {
        if (step === 4) {
            if (period.startsWith('M')) return 'M1';
            if (period.startsWith('T')) return 'T1';
            if (period.startsWith('N')) return 'N1';
        } else {
            if (period === 'M1' || period === 'M2') return 'M1';
            if (period === 'M3' || period === 'M4' || period === 'M5' || period === 'M6') return 'M3';
            if (period === 'T1' || period === 'T2') return 'T1';
            if (period === 'T3' || period === 'T4' || period === 'T5' || period === 'T6') return 'T3';
            if (period === 'N1' || period === 'N2') return 'N1';
            if (period === 'N3' || period === 'N4' || period === 'N5' || period === 'N6') return 'N3';
        }
        return period;
    };

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
    const handleCellClick = (day: DayOfWeek, period: TimePeriod) => {
        if (mode !== 'SCHEDULE') return;
        const existing = getCellContent(day, period);
        if (existing) return;

        setTargetCell({ day, period });
        setSelectedSubjectId('');
        setIsModalOpen(true);
    };

    const confirmAddClass = async () => {
        if (!targetCell || !selectedSubjectId) return;
        try {
            await onAddTimetable({
                subjectId: selectedSubjectId,
                day: targetCell.day,
                period: targetCell.period as TimePeriod
            });
            setIsModalOpen(false);
        } catch (error) {
            console.error("Conflict checking / saving error:", error);
            alert("No se pudo guardar la materia o ya existe un conflicto en este horario.");
        }
    };

    // Helper
    const getCellContent = (day: DayOfWeek, periodKey: string) => {
        return timetables.find(t => t.dayOfWeek === day && normalizePeriod(t.period, gridStep) === periodKey);
    };

    // Filtered & Sorted subjects: Only Disponible or Recursada
    const validSubjects = subjects.filter(
        (s) => s.status === SubjectStatus.DISPONIBLE || s.status === SubjectStatus.RECURSADA
    );

    const sortedSubjects = [...validSubjects].sort((a, b) => {
        const aRec = recommendedIds.has(a.id);
        const bRec = recommendedIds.has(b.id);
        if (aRec && !bRec) return -1;
        if (!aRec && bRec) return 1;
        return a.name.localeCompare(b.name);
    });

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

                <div className="flex items-center gap-2 bg-elevated p-1 rounded-lg border border-app transition-opacity shadow-subtle">
                    <button
                        onClick={() => setGridStep(2)}
                        className={cn("p-2 rounded-md flex items-center gap-2 text-xs font-bold transition-all",
                            gridStep === 2 ? "bg-app-bg text-app shadow-sm border border-app border-dashed" : "text-muted hover:text-app"
                        )}
                        title="Grilla cada 2 hs"
                    >
                        <Grid3X3 size={16} /> 2h
                    </button>
                    <button
                        onClick={() => setGridStep(4)}
                        className={cn("p-2 rounded-md flex items-center gap-2 text-xs font-bold transition-all",
                            gridStep === 4 ? "bg-app-bg text-app shadow-sm border border-app border-dashed" : "text-muted hover:text-app"
                        )}
                        title="Grilla cada 4 hs"
                    >
                        <Grid2X2 size={16} /> 4h
                    </button>
                </div>
            </div>

            <div className="select-none bg-elevated rounded-xl border border-app shadow-soft overflow-hidden overflow-x-auto relative">
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr>
                            <th className="p-3 border-b border-r border-app bg-surface text-center min-w-[70px] text-muted font-bold font-retro">Turno</th>
                            {DAYS.map(day => (
                                <th key={day.key} className="p-3 border-b border-app bg-surface text-center min-w-[130px] text-app font-bold uppercase tracking-wider">
                                    {day.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {activePeriods.map((period) => (
                            <tr key={period.key}>
                                <td className="p-3 border-r border-b border-app/50 font-mono text-muted text-center bg-surface/50 font-bold">
                                    {period.label}
                                </td>
                                {DAYS.map((day) => {
                                    const key = `${day.key}-${period.key}`;
                                    const isAvailable = availability.get(key) || false;
                                    const timetableItem = getCellContent(day.key, period.key);

                                    return (
                                        <td
                                            key={key}
                                            className={cn(
                                                "p-0 border-b border-r border-app/30 align-top h-14 relative transition-colors duration-200",
                                                mode === 'AVAILABILITY' && "cursor-pointer hover:bg-white/5",
                                                mode === 'AVAILABILITY' && isAvailable && "bg-green-500/20 hover:bg-green-500/30",
                                                mode === 'SCHEDULE' && !isAvailable && "bg-app-bg",
                                                mode === 'SCHEDULE' && !timetableItem && "cursor-pointer hover:bg-blue-500/10"
                                            )}
                                            onMouseDown={() => handleMouseDown(day.key, period.key)}
                                            onMouseEnter={() => handleMouseEnter(day.key, period.key)}
                                            onClick={() => handleCellClick(day.key, period.key as TimePeriod)}
                                        >
                                            {/* Availability Indicator */}
                                            {mode === 'SCHEDULE' && isAvailable && !timetableItem && (
                                                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-green-500/60 shadow-[0_0_4px_rgba(34,197,94,0.6)]" title="Disponible" />
                                            )}

                                            {/* Schedule Item */}
                                            {timetableItem && (
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
                                            {mode === 'SCHEDULE' && !timetableItem && (hoveredCell === `${day.key}-${period.key}`) && (
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
                        <div className="bg-surface border-2 border-app rounded-xl p-0 w-full max-w-md shadow-retro scale-100 animate-in zoom-in-95 overflow-hidden">
                            <div className="bg-elevated p-5 border-b border-app">
                                <h3 className="text-xl font-bold text-app font-retro tracking-wide">Asignar Materia</h3>
                                <p className="text-sm text-muted mt-1 font-mono">
                                    {DAYS.find(d => d.key === targetCell?.day)?.label} - {activePeriods.find(p => p.key === targetCell?.period)?.label}
                                </p>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-muted mb-2 uppercase tracking-wide">Seleccionar Cursada (Lista Filtrada)</label>
                                    <select
                                        className="w-full bg-app-bg border border-app rounded-lg px-3 py-3 text-app focus:ring-2 focus:ring-unlam-500/50 outline-none shadow-inner"
                                        value={selectedSubjectId}
                                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                                        size={8}
                                    >
                                        <option value="" disabled className="text-muted/50 py-1 border-b border-app/20 line-through">-- Solo Disponibles/Recursadas --</option>
                                        {sortedSubjects.map(s => (
                                            <option key={s.id} value={s.id} className={cn(
                                                "py-1.5 px-2 rounded-sm mb-1 cursor-pointer",
                                                recommendedIds.has(s.id) ? "font-bold text-unlam-500 bg-unlam-500/5" : "hover:bg-surface"
                                            )}>
                                                {recommendedIds.has(s.id) ? "★ " : ""}{s.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-muted mt-2 block">* Las materias "estrella" son obligatorias y recomendadas por tu historial.</p>
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
                                        disabled={!selectedSubjectId}
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
                        ? '🟢 Pulsa o mantén el click para arrastrar entre celdas marcando disponibilidad.'
                        : '📅 Haz clic en una celda de turno para asignar una materia.'}
                </p>
            </div>
        </div>
    );
};
