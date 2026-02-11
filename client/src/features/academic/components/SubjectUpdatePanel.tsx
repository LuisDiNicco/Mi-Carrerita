import { useEffect, useState } from 'react';
import type { Subject, SubjectStatus } from '../../../shared/types/academic';
import { SubjectStatus as SubjectStatusMap } from '../../../shared/types/academic';
import { RetroButton } from '../../../shared/ui/RetroButton';

interface SubjectUpdatePanelProps {
  subject: Subject | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    status: SubjectStatus;
    grade: number | null;
    difficulty: number | null;
    statusDate: string | null;
    notes: string | null;
  }) => Promise<void>;
}

const statusOptions: Array<{ label: string; value: SubjectStatus; disabled?: boolean }> = [
  { label: 'Disponible (automatico)', value: SubjectStatusMap.DISPONIBLE, disabled: true },
  { label: 'Pendiente', value: SubjectStatusMap.PENDIENTE },
  { label: 'En curso', value: SubjectStatusMap.EN_CURSO },
  { label: 'Regularizada', value: SubjectStatusMap.REGULARIZADA },
  { label: 'Aprobada', value: SubjectStatusMap.APROBADA },
];

export const SubjectUpdatePanel = ({ subject, isOpen, onClose, onSave }: SubjectUpdatePanelProps) => {
  const [status, setStatus] = useState<SubjectStatus>(SubjectStatusMap.PENDIENTE);
  const [grade, setGrade] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [statusDate, setStatusDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subject) return;

    setStatus(subject.status);
    setGrade(subject.grade !== null ? String(subject.grade) : '');
    setDifficulty(subject.difficulty !== null && subject.difficulty !== undefined ? String(subject.difficulty) : '');
    setStatusDate(subject.statusDate ?? '');
    setNotes(subject.notes ?? '');
  }, [subject]);

  if (!isOpen || !subject) return null;

  const isStatusLocked = status === SubjectStatusMap.DISPONIBLE;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const gradeValue = grade.trim() === '' ? null : Number(grade);
      const normalizedGrade = gradeValue !== null && Number.isNaN(gradeValue) ? null : gradeValue;
      const difficultyValue = difficulty.trim() === '' ? null : Number(difficulty);
      const normalizedDifficulty =
        difficultyValue !== null && Number.isNaN(difficultyValue) ? null : difficultyValue;
      const statusDateValue = statusDate.trim() === '' ? null : statusDate;
      const notesValue = notes.trim() === '' ? null : notes.trim();

      await onSave({
        status,
        grade: normalizedGrade,
        difficulty: normalizedDifficulty,
        statusDate: statusDateValue,
        notes: notesValue,
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl bg-surface border border-app rounded-xl shadow-soft p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-muted uppercase tracking-wider">Actualizar materia</p>
            <h2 className="text-2xl font-bold text-app">{subject.name}</h2>
            <p className="text-sm text-muted">Codigo {subject.planCode}</p>
          </div>
          <button
            className="text-muted hover:text-app transition-colors"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-muted">
            Estado
            <select
              className="bg-surface border border-app rounded-lg px-3 py-2 text-app"
              value={status}
              onChange={(event) => setStatus(event.target.value as SubjectStatus)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-muted">
            Nota final
            <input
              type="number"
              min={0}
              max={10}
              className="bg-surface border border-app rounded-lg px-3 py-2 text-app"
              value={grade}
              onChange={(event) => setGrade(event.target.value)}
              placeholder="Ej: 8"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-muted">
            Dificultad (1-100)
            <input
              type="number"
              min={1}
              max={100}
              className="bg-surface border border-app rounded-lg px-3 py-2 text-app"
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
              placeholder="Ej: 70"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-muted">
            Fecha
            <input
              type="date"
              className="bg-surface border border-app rounded-lg px-3 py-2 text-app"
              value={statusDate}
              onChange={(event) => setStatusDate(event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-muted md:col-span-2">
            Comentarios
            <textarea
              rows={4}
              className="bg-surface border border-app rounded-lg px-3 py-2 text-app resize-none"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Agrega un comentario o recordatorio..."
            />
          </label>
        </div>

        {isStatusLocked && (
          <p className="mt-3 text-xs text-muted">
            El estado Disponible se calcula automaticamente. Elegi un estado real.
          </p>
        )}

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button className="text-sm text-muted hover:text-app" onClick={onClose}>
            Cancelar
          </button>
          <RetroButton
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={isSaving || isStatusLocked}
          >
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </RetroButton>
        </div>
      </div>
    </div>
  );
};
