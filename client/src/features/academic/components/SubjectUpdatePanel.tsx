import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Subject } from '../../../shared/types/academic';
import { SubjectStatus } from '../../../shared/types/academic';
import { RetroButton } from '../../../shared/ui/RetroButton';
import { Calendar } from 'lucide-react';

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

  const statusOptions = [
    { label: 'Pendiente', value: SubjectStatus.PENDIENTE },
    { label: 'Disponible', value: SubjectStatus.DISPONIBLE, disabled: true },
    { label: 'En curso', value: SubjectStatus.EN_CURSO },
    { label: 'Recursada', value: SubjectStatus.RECURSADA },
    { label: 'Regularizada', value: SubjectStatus.REGULARIZADA },
    { label: 'Aprobada', value: SubjectStatus.APROBADA },
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
    setStatusDate(subject.statusDate ? subject.statusDate.split('T')[0] : '');
    setNotes(subject.notes ?? '');
    setConfirmOpen(false); // Reset confirmation on subject change
    setError(null);
  }, [subject]);

  useEffect(() => {
    if (status === SubjectStatus.RECURSADA) {
      setGrade('2');
    }
  }, [status]);

  if (!isOpen || !subject) return null;

  const isStatusLocked = status === SubjectStatus.DISPONIBLE;

  const executeSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      if (status === SubjectStatus.APROBADA) {
        if (grade.trim() === '') {
          setError("La nota es obligatoria para materias Aprobadas.");
          setIsSaving(false);
          return;
        }
      }

      if (grade.trim() !== '') {
        const gradeValue = Number(grade);
        if (Number.isNaN(gradeValue) || gradeValue < 1 || gradeValue > 10) {
          setError("La nota debe ser un número entre 1 y 10.");
          setIsSaving(false);
          return;
        }
      }

      if (difficulty.trim() !== '') {
        const diffValue = Number(difficulty);
        if (Number.isNaN(diffValue) || diffValue < 1 || diffValue > 100) {
          setError("La dificultad debe ser un número entre 1 y 100.");
          setIsSaving(false);
          return;
        }
      }

      const gradeValue = grade.trim() === '' ? null : Number(grade);
      const normalizedGrade = gradeValue !== null && Number.isNaN(gradeValue) ? null : gradeValue;
      const difficultyValue = difficulty.trim() === '' ? null : Number(difficulty);
      const normalizedDifficulty = difficultyValue !== null && Number.isNaN(difficultyValue) ? null : difficultyValue;
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
      const message = err instanceof Error ? err.message : 'No se pudo guardar la materia. Por favor, revisa los datos e intenta nuevamente.';
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

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-surface border-2 border-app rounded-xl shadow-retro p-0 flex flex-col md:flex-row overflow-hidden animate-[fadeInUp_0.3s_ease-out]">

        {/* Left Side: Header info & Status */}
        <div className="md:w-1/3 bg-elevated p-6 border-b md:border-b-0 md:border-r border-app flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-muted uppercase tracking-widest font-bold mb-2">Actualizar Materia</p>
            <h2 className="text-xl md:text-2xl font-bold text-app font-retro mb-4 leading-tight">{subject.name}</h2>
            <div className="inline-block bg-surface px-2 py-1 border border-app rounded text-xs font-mono text-muted mb-6">
              Código: {subject.planCode}
            </div>

            <label className="flex flex-col gap-2 text-sm text-muted">
              <span className="font-bold flex items-center gap-2">Estado</span>
              <select
                className="bg-surface border-2 border-app rounded-lg px-3 py-2 text-app font-bold focus:ring-2 focus:ring-unlam-500/50 outline-none transition-all shadow-subtle hover:shadow-soft"
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

            {isStatusLocked && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs tracking-wide">
                <span className="text-blue-400 font-bold mb-1 block">INFO:</span>
                El estado <strong className="text-blue-300">Disponible</strong> se calcula automáticamente. Para modificar la materia, elegí un estado real.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Details Form */}
        <div className="md:w-2/3 p-6 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-retro text-app border-b-2 border-unlam-500/30 pb-1 inline-block">Detalles</h3>
            <button
              className="text-muted hover:text-red-400 bg-surface border border-transparent hover:border-red-400/50 transition-all text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg shadow-sm"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          {confirmOpen ? (
            <div className="space-y-4 flex-1 flex flex-col justify-center animate-[fadeIn_0.3s_ease-out]">
              <div className="p-5 border-2 border-yellow-500/50 bg-yellow-500/10 rounded-xl shadow-soft">
                <h3 className="text-xl font-bold text-yellow-500 mb-3 font-retro flex items-center gap-2">
                  <span className="text-2xl">⚠️</span> ¿Forzar Cambio?
                </h3>
                <p className="text-sm text-app/90 leading-relaxed">
                  Esta materia figura como <strong className="bg-yellow-500/20 px-1 rounded text-yellow-400">PENDIENTE</strong> (bloqueada).
                  <br /><br />
                  Si cambias su estado manualmente, podrías estar rompiendo la cadena de correlatividades o el flujo del plan de estudios.
                  ¿Deseas continuar bajo tu propio riesgo?
                </p>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="px-5 py-2 text-sm font-bold text-muted hover:text-app bg-surface rounded-lg border border-app-border hover:border-app transition-all"
                >
                  Regresar
                </button>
                <RetroButton
                  variant="warning"
                  size="md"
                  onClick={executeSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Forzando...' : 'Forzar cambio'}
                </RetroButton>
              </div>
            </div>
          ) : (
            <div className="space-y-5 flex-1 flex flex-col">
              <div className="grid grid-cols-2 gap-5">
                <label className="flex flex-col gap-2 text-sm text-muted">
                  <span className="font-bold flex justify-between">
                    Nota
                    {status === SubjectStatus.APROBADA ? (
                      <span className="font-bold text-[10px] text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">* Obligatorio</span>
                    ) : (
                      <span className="font-normal text-[10px] bg-surface px-1.5 py-0.5 rounded border border-app-border">Opcional</span>
                    )}
                  </span>
                  <input
                    type="text"
                    className="w-full bg-elevated border-2 border-app-border rounded-lg px-3 py-2.5 text-app focus:border-unlam-500 focus:ring-2 focus:ring-unlam-500/20 outline-none transition-all placeholder:text-muted/50"
                    value={grade}
                    placeholder="Ej: 8"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setGrade(val);
                      }
                    }}
                    disabled={status === SubjectStatus.RECURSADA}
                  />
                  {status === SubjectStatus.RECURSADA && <span className="text-[10px] text-red-400 tracking-wide">* Nota asignada auto x recursar</span>}
                </label>

                <label className="flex flex-col gap-2 text-sm text-muted">
                  <span className="font-bold flex justify-between">Dificultad <span className="font-normal text-[10px] text-unlam-400 bg-unlam-500/10 px-1.5 py-0.5 rounded">1-100</span></span>
                  <div className="relative custom-number-input">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      className="w-full bg-elevated border-2 border-app-border rounded-lg px-3 py-2.5 text-app focus:border-unlam-500 focus:ring-2 focus:ring-unlam-500/20 outline-none transition-all placeholder:text-muted/50"
                      value={difficulty}
                      onChange={(event) => setDifficulty(event.target.value)}
                      placeholder="Ej: 70"
                    />
                  </div>
                </label>
              </div>

              <label className="flex flex-col gap-2 text-sm text-muted">
                <span className="font-bold">Fecha de Aprobación/Regularidad</span>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    maxLength={10}
                    className="w-full bg-elevated border-2 border-app-border rounded-lg pl-3 pr-10 py-2.5 text-app focus:border-unlam-500 focus:ring-2 focus:ring-unlam-500/20 outline-none transition-all placeholder:text-muted/50 font-mono text-sm"
                    value={statusDate}
                    onChange={(event) => {
                      // Allow manual typing of YYYY-MM-DD
                      let val = event.target.value.replace(/[^\d-]/g, '');
                      setStatusDate(val);
                    }}
                    placeholder="YYYY-MM-DD"
                  />
                  <button
                    type="button"
                    className="absolute right-2 p-1.5 text-muted hover:text-unlam-500 transition-colors cursor-pointer bg-elevated rounded"
                    onClick={(e) => {
                      const dateInput = e.currentTarget.nextElementSibling as HTMLInputElement;
                      if (dateInput && dateInput.showPicker) {
                        try {
                          dateInput.showPicker();
                        } catch (err) { }
                      }
                    }}
                    title="Abrir calendario"
                  >
                    <Calendar size={18} />
                  </button>
                  <input
                    type="date"
                    className="absolute right-4 bottom-0 top-0 w-0 h-0 opacity-0 pointer-events-none"
                    onChange={(e) => setStatusDate(e.target.value)}
                  />
                </div>
              </label>

              <label className="flex flex-col gap-2 text-sm text-muted flex-1">
                <span className="font-bold">Comentarios o Recordatorios</span>
                <textarea
                  className="w-full h-full min-h-[80px] bg-elevated border-2 border-app-border rounded-lg px-3 py-2.5 text-app resize-none focus:border-unlam-500 focus:ring-2 focus:ring-unlam-500/20 outline-none transition-all placeholder:text-muted/50"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Ej: El final es oral y toma diseño de DB..."
                />
              </label>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg animate-[fadeIn_0.2s_ease-in]">
                  <p className="text-sm text-red-400 font-bold flex items-center gap-2">
                    <span>⛔</span> {error}
                  </p>
                </div>
              )}

              <div className="mt-auto pt-4 flex items-center justify-end gap-3 border-t border-app-border/50">
                <button
                  className="px-5 py-2 text-sm font-bold text-muted hover:text-app bg-surface rounded-lg border border-transparent hover:border-app transition-all"
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
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </RetroButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
