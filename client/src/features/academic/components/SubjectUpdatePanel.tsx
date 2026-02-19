import { useEffect, useState } from 'react';
import type { Subject } from '../../../shared/types/academic';
import { SubjectStatus } from '../../../shared/types/academic';
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

export const SubjectUpdatePanel = ({ subject, isOpen, onClose, onSave }: SubjectUpdatePanelProps) => {
  const [status, setStatus] = useState<SubjectStatus>(SubjectStatus.PENDIENTE);
  const [grade, setGrade] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [statusDate, setStatusDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Define options inside or use memo efficiently.
  // Using the imported SubjectStatus object directly.
  const statusOptions = [
    { label: 'Disponible (auto)', value: SubjectStatus.DISPONIBLE, disabled: true },
    { label: 'Pendiente', value: SubjectStatus.PENDIENTE },
    { label: 'En curso', value: SubjectStatus.EN_CURSO },
    { label: 'Regularizada', value: SubjectStatus.REGULARIZADA },
    { label: 'Aprobada', value: SubjectStatus.APROBADA },
    { label: 'Recursada', value: SubjectStatus.RECURSADA },
  ];

  useEffect(() => {
    if (!subject) return;

    // Safety check: if subject.status is invalid, default to PENDIENTE
    const cleanStatus = Object.values(SubjectStatus).includes(subject.status)
      ? subject.status
      : SubjectStatus.PENDIENTE;

    setStatus(cleanStatus);
    setGrade(subject.grade !== null ? String(subject.grade) : '');
    setDifficulty(subject.difficulty !== null && subject.difficulty !== undefined ? String(subject.difficulty) : '');
    setStatusDate(subject.statusDate ?? '');
    setNotes(subject.notes ?? '');
    setConfirmOpen(false); // Reset confirmation on subject change
    setError(null);
  }, [subject]);

  if (!isOpen || !subject) return null;

  const isStatusLocked = status === SubjectStatus.DISPONIBLE;

  const executeSave = async () => {
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
      console.error("Error saving subject:", err);
      const message = err instanceof Error ? err.message : 'No se pudo guardar.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (subject.status === SubjectStatus.PENDIENTE && status !== SubjectStatus.PENDIENTE) {
      setConfirmOpen(true);
      return;
    }
    await executeSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl bg-surface border border-app rounded-xl shadow-soft p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-muted uppercase tracking-wider">Actualizar materia</p>
            <h2 className="text-2xl font-bold text-app font-retro">{subject.name}</h2>
            <p className="text-sm text-muted">Codigo {subject.planCode}</p>
          </div>
          <button
            className="text-muted hover:text-app transition-colors text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-elevated"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {confirmOpen ? (
          <div className="space-y-4 animate-fade-in-up">
            <div className="p-4 border-2 border-yellow-500/50 bg-yellow-500/10 rounded-lg">
              <h3 className="text-lg font-bold text-yellow-500 mb-2 font-retro">⚠️ ¿Estás seguro?</h3>
              <p className="text-sm text-app/90 leading-relaxed">
                Esta materia figura como <strong>PENDIENTE</strong> (bloqueada por correlativas).
                <br /><br />
                Si cambias su estado manualmente, podrías estar rompiendo la cadena de correlatividades.
                ¿Deseas continuar de todas formas?
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 text-sm font-bold text-muted hover:text-app"
              >
                Cancelar
              </button>
              <RetroButton
                variant="warning"
                size="md"
                onClick={executeSave}
                disabled={isSaving}
              >
                {isSaving ? 'Forzar cambio...' : 'Sí, forzar cambio'}
              </RetroButton>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-muted">
                <span className="font-bold">Estado</span>
                <select
                  className="bg-surface border border-app rounded-lg px-3 py-2 text-app focus:ring-2 focus:ring-unlam-500/50 outline-none"
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
                <span className="font-bold">Nota</span>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full bg-surface border border-app rounded-lg px-3 py-2 text-app focus:ring-2 focus:ring-unlam-500/50 outline-none"
                    value={grade}
                    placeholder="Ej: 8"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setGrade(val);
                      }
                    }}
                  />
                </div>
              </label>

              <label className="flex flex-col gap-2 text-sm text-muted">
                <span className="font-bold">Dificultad (1-100)</span>
                <div className="relative custom-number-input">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    className="w-full bg-surface border border-app rounded-lg px-3 py-2 text-app focus:ring-2 focus:ring-unlam-500/50 outline-none"
                    value={difficulty}
                    onChange={(event) => setDifficulty(event.target.value)}
                    placeholder="Ej: 70"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-2 text-sm text-muted">
                <span className="font-bold">Fecha</span>
                <input
                  type="date"
                  className="bg-surface border border-app rounded-lg px-3 py-2 text-app focus:ring-2 focus:ring-unlam-500/50 outline-none"
                  value={statusDate}
                  onChange={(event) => setStatusDate(event.target.value)}
                />
              </label>

              <label className="flex flex-col gap-2 text-sm text-muted md:col-span-2">
                <span className="font-bold">Comentarios</span>
                <textarea
                  rows={3}
                  className="bg-surface border border-app rounded-lg px-3 py-2 text-app resize-none focus:ring-2 focus:ring-unlam-500/50 outline-none"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Agrega un comentario o recordatorio..."
                />
              </label>
            </div>

            {isStatusLocked && (
              <p className="px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-app/80">
                ℹ️ El estado <strong>Disponible</strong> se calcula automáticamente. Para modificar la materia, elegí un estado real (Cursando, Aprobada, etc).
              </p>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-500 font-bold">⚠️ {error}</p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-app-border/50">
              <button
                className="px-4 py-2 text-sm font-bold text-muted hover:text-app transition-colors"
                onClick={onClose}
              >
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
        )}
      </div>
    </div>
  );
};
