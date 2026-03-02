import { Edit2, X, Calendar, AlertTriangle } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { RetroCalendar } from '../../../shared/ui';
import { STATUS_OPTIONS } from '../hooks/useHistoryTable';
import type { Subject } from '../../../shared/types/academic';
import { SubjectStatus } from '../../../shared/types/academic';

interface HistoryEditorProps {
    subjects: Subject[];
    editingId: string | null;
    subjectId: string;
    setSubjectId: (val: string) => void;
    status: SubjectStatus;
    setStatus: (val: SubjectStatus) => void;
    grade: string;
    setGrade: (val: string) => void;
    difficulty: string;
    setDifficulty: (val: string) => void;
    statusDate: string;
    setStatusDate: (val: string) => void;
    notes: string;
    setNotes: (val: string) => void;
    isSaving: boolean;
    error: string | null;
    isCalendarOpen: boolean;
    setIsCalendarOpen: (val: boolean) => void;
    handleSave: () => void;
    resetForm: () => void;
}

export function HistoryEditor({
    subjects,
    editingId,
    subjectId, setSubjectId,
    status, setStatus,
    grade, setGrade,
    difficulty, setDifficulty,
    statusDate, setStatusDate,
    notes, setNotes,
    isSaving,
    error,
    isCalendarOpen, setIsCalendarOpen,
    handleSave,
    resetForm,
}: HistoryEditorProps) {
    return (
        <div className={cn(
            "rounded-2xl border transition-all duration-300 p-5 shadow-subtle",
            editingId ? "border-unlam-500 bg-unlam-500/5 ring-1 ring-unlam-500/30" : "border-app bg-elevated"
        )}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-app flex items-center gap-2">
                    {editingId ? <><Edit2 size={18} /> Editando Registro</> : 'Cargar Nuevo Registro'}
                </h3>
                {editingId && (
                    <button onClick={resetForm} className="text-sm text-muted hover:text-destructive flex items-center gap-1">
                        <X size={14} /> Cancelar
                    </button>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <label className="flex flex-col gap-2 text-sm text-muted">
                    Materia
                    <select
                        className="bg-surface border border-app rounded-lg px-3 py-2 text-app disabled:opacity-50"
                        value={subjectId}
                        onChange={(event) => setSubjectId(event.target.value)}
                        disabled={!!editingId}
                    >
                        {subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                                {subject.planCode} - {subject.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-2 text-sm text-muted">
                    Estado
                    <select
                        className="bg-surface border border-app rounded-lg px-3 py-2 text-app"
                        value={status}
                        onChange={(event) => setStatus(event.target.value as SubjectStatus)}
                    >
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-2 text-sm text-muted">
                    Nota (0-10)
                    <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.01}
                        className="bg-surface border border-app rounded-lg px-3 py-2 text-app placeholder-muted/30"
                        value={grade}
                        onChange={(event) => setGrade(event.target.value)}
                        placeholder="-"
                    />
                </label>

                <label className="flex flex-col gap-2 text-sm text-muted">
                    Dificultad (1-100)
                    <input
                        type="number"
                        min={1}
                        max={100}
                        className="bg-surface border border-app rounded-lg px-3 py-2 text-app placeholder-muted/30"
                        value={difficulty}
                        onChange={(event) => setDifficulty(event.target.value)}
                        placeholder="Opcional"
                    />
                </label>

                <label className="flex flex-col gap-2 text-sm text-muted">
                    Fecha (DD/MM/YYYY)
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            maxLength={10}
                            className="w-full bg-surface border border-app rounded-lg pl-3 pr-10 py-2 text-app focus:ring-1 focus:ring-unlam-500 outline-none transition-all placeholder:text-muted/50 font-mono text-sm"
                            value={statusDate}
                            onChange={(event) => {
                                let val = event.target.value.replace(/[^\d]/g, '');
                                if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
                                if (val.length > 5) val = val.slice(0, 5) + '/' + val.slice(5);
                                setStatusDate(val.slice(0, 10));
                            }}
                            placeholder="DD/MM/YYYY"
                        />
                        <button
                            type="button"
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                            className="absolute right-2 p-1 text-muted hover:text-unlam-500 transition-colors cursor-pointer bg-surface rounded"
                            title="Abrir calendario"
                        >
                            <Calendar size={16} />
                        </button>
                        {isCalendarOpen && (
                            <RetroCalendar
                                value={statusDate}
                                onChange={setStatusDate}
                                onClose={() => setIsCalendarOpen(false)}
                            />
                        )}
                    </div>
                </label>

                <label className="flex flex-col gap-2 text-sm text-muted md:col-span-3 lg:col-span-1">
                    Comentarios
                    <input
                        type="text"
                        className="bg-surface border border-app rounded-lg px-3 py-2 text-app placeholder-muted/30"
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Notas breves..."
                    />
                </label>
            </div>

            {error && <p className="mt-3 text-sm text-destructive flex items-center gap-2"><AlertTriangle size={14} /> {error}</p>}

            <div className="mt-4 flex justify-end">
                <button
                    className={cn(
                        "rounded-lg px-6 py-2 text-sm font-bold transition-all shadow-md",
                        editingId
                            ? "bg-unlam-500 text-black hover:bg-unlam-600"
                            : "bg-surface border border-app text-app hover:bg-app-elevated"
                    )}
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? 'Guardando...' : editingId ? 'Actualizar Registro' : 'Guardar Nuevo'}
                </button>
            </div>
        </div>
    );
}

