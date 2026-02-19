import { useEffect, useState, useMemo } from 'react';
import { fetchTimetables, createTimetable, deleteTimetable } from './lib/schedule-api';
import type { TimetableDto, TimePeriod, DayOfWeek } from './lib/schedule-api';
import { useAcademicStore } from '../academic/store/academic-store';
import { fetchAcademicGraph } from '../academic/lib/academic-api';
import { Trash2, Plus } from 'lucide-react';

const DAYS: { key: DayOfWeek; label: string }[] = [
    { key: 'MONDAY', label: 'Lunes' },
    { key: 'TUESDAY', label: 'Martes' },
    { key: 'WEDNESDAY', label: 'Miércoles' },
    { key: 'THURSDAY', label: 'Jueves' },
    { key: 'FRIDAY', label: 'Viernes' },
    { key: 'SATURDAY', label: 'Sábado' },
];

const PERIODS: { key: TimePeriod; label: string }[] = [
    { key: 'M1', label: '08:00 - 09:00' },
    { key: 'M2', label: '09:00 - 10:00' },
    { key: 'M3', label: '10:00 - 11:00' },
    { key: 'M4', label: '11:00 - 12:00' },
    { key: 'M5', label: '12:00 - 13:00' },
    { key: 'M6', label: '13:00 - 14:00' },
    { key: 'T1', label: '14:00 - 15:00' },
    { key: 'T2', label: '15:00 - 16:00' },
    { key: 'T3', label: '16:00 - 17:00' },
    { key: 'T4', label: '17:00 - 18:00' },
    { key: 'T5', label: '18:00 - 19:00' },
    { key: 'T6', label: '19:00 - 20:00' },
    { key: 'N1', label: '19:00 - 20:00' },
    { key: 'N2', label: '20:00 - 21:00' },
    { key: 'N3', label: '21:00 - 22:00' },
    { key: 'N4', label: '22:00 - 23:00' },
    { key: 'N5', label: '23:00 - 00:00' },
    { key: 'N6', label: '00:00 - 01:00' },
];

export const SchedulePage = () => {
    const [timetables, setTimetables] = useState<TimetableDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MONDAY');
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('M1');
    const [isAdding, setIsAdding] = useState(false);

    const subjects = useAcademicStore((state) => state.subjects);
    const setSubjects = useAcademicStore((state) => state.setSubjects);

    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);
                const [timetableData, subjectData] = await Promise.all([
                    fetchTimetables(),
                    subjects.length === 0 ? fetchAcademicGraph() : Promise.resolve(subjects)
                ]);

                setTimetables(timetableData);
                if (subjects.length === 0) setSubjects(subjectData);
            } catch (err) {
                console.error("Error loading schedule data:", err);
                setError("No se pudo cargar el horario.");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [subjects.length, setSubjects]);

    const handleAddTimetable = async () => {
        if (!selectedSubjectId) return;
        setIsAdding(true);
        try {
            const newTimetable = await createTimetable({
                subjectId: selectedSubjectId,
                dayOfWeek: selectedDay,
                period: selectedPeriod,
            });
            setTimetables([...timetables, newTimetable]);
        } catch (err) {
            alert("Error al agregar horario. Posiblemente ya existe o hay conflicto.");
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteTimetable = async (subjectId: string) => {
        if (!confirm('¿Eliminar todos los horarios de esta materia?')) return;
        try {
            await deleteTimetable(subjectId);
            setTimetables(timetables.filter(t => t.subjectId !== subjectId));
        } catch (err) {
            alert("Error al eliminar horario.");
        }
    };

    // Helper to get item for cell
    const getCellContent = (day: DayOfWeek, periodKey: TimePeriod) => {
        const match = timetables.find(t => t.dayOfWeek === day && t.period === periodKey);
        return match;
    };

    // Sort subjects for dropdown
    const sortedSubjects = useMemo(() => {
        return [...subjects].sort((a, b) => a.name.localeCompare(b.name));
    }, [subjects]);

    if (loading) return <div className="p-8 text-center text-muted">Cargando horarios...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-app font-retro mb-1">Mi Horario</h2>
                    <p className="text-muted">Organiza tu cursada semanal</p>
                </div>

                <div className="flex flex-wrap gap-2 items-end bg-elevated p-3 rounded-xl border border-app shadow-subtle">
                    <label className="text-xs text-muted block">
                        Materia
                        <select
                            className="block w-40 mt-1 bg-surface border border-app rounded px-2 py-1 text-app text-sm"
                            value={selectedSubjectId}
                            onChange={(e) => setSelectedSubjectId(e.target.value)}
                        >
                            <option value="">Seleccionar...</option>
                            {sortedSubjects.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.planCode})</option>
                            ))}
                        </select>
                    </label>
                    <label className="text-xs text-muted block">
                        Día
                        <select
                            className="block w-28 mt-1 bg-surface border border-app rounded px-2 py-1 text-app text-sm"
                            value={selectedDay}
                            onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
                        >
                            {DAYS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                        </select>
                    </label>
                    <label className="text-xs text-muted block">
                        Horario
                        <select
                            className="block w-32 mt-1 bg-surface border border-app rounded px-2 py-1 text-app text-sm"
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value as TimePeriod)}
                        >
                            {PERIODS.map(p => <option key={p.key} value={p.key}>{p.key} ({p.label})</option>)}
                        </select>
                    </label>
                    <button
                        onClick={handleAddTimetable}
                        disabled={isAdding || !selectedSubjectId}
                        className="bg-unlam-500 text-black font-bold p-2.5 rounded hover:bg-unlam-600 disabled:opacity-50 transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </header>

            {/* Grid */}
            <div className="overflow-x-auto rounded-xl border border-app shadow-subtle bg-elevated">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr>
                            <th className="p-3 border-b border-r border-app bg-surface text-left min-w-[100px]">Horario</th>
                            {DAYS.map(day => (
                                <th key={day.key} className="p-3 border-b border-app bg-surface text-center min-w-[140px]">
                                    {day.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {PERIODS.map((period) => (
                            <tr key={period.key} className="hover:bg-white/5">
                                <td className="p-2 border-r border-b border-app/50 font-mono text-xs text-muted bg-surface/50">
                                    <div className="font-bold text-app">{period.key}</div>
                                    <div>{period.label}</div>
                                </td>
                                {DAYS.map((day) => {
                                    const item = getCellContent(day.key, period.key);
                                    return (
                                        <td key={`${day.key}-${period.key}`} className="p-1 border-b border-r border-app/30 align-top h-20">
                                            {item ? (
                                                <div className="h-full w-full bg-unlam-500/10 border border-unlam-500/30 rounded p-2 relative group hover:bg-unlam-500/20 transition-colors">
                                                    <p className="font-bold text-xs text-unlam-300 line-clamp-2" title={item.subjectName}>
                                                        {item.subjectName}
                                                    </p>
                                                    <p className="text-[10px] text-muted">{item.planCode}</p>
                                                    <button
                                                        onClick={() => handleDeleteTimetable(item.subjectId)}
                                                        className="absolute top-1 right-1 opacity-100 md:opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1 bg-black/50 rounded"
                                                        title="Borrar materia del horario"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ) : null}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
