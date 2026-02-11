import { useEffect, useMemo, useState } from 'react';
import { useAcademicStore } from '../store/academic-store';
import { formatDate, formatGrade } from '../../../shared/lib/utils';
import { authFetch } from '../../auth/lib/api';
import { SubjectStatus } from '../../../shared/types/academic';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const STATUS_OPTIONS = [
  { label: 'Pendiente', value: SubjectStatus.PENDIENTE },
  { label: 'En curso', value: SubjectStatus.EN_CURSO },
  { label: 'Regularizada', value: SubjectStatus.REGULARIZADA },
  { label: 'Aprobada', value: SubjectStatus.APROBADA },
];

export const HistoryTable = () => {
  const subjects = useAcademicStore((state) => state.subjects);
  const updateSubject = useAcademicStore((state) => state.updateSubject);
  const setSubjects = useAcademicStore((state) => state.setSubjects);
  const [subjectId, setSubjectId] = useState('');
  const [status, setStatus] = useState<SubjectStatus>(SubjectStatus.APROBADA);
  const [grade, setGrade] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [statusDate, setStatusDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (subjects.length > 0 && !subjectId) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId]);

  const rows = useMemo(() => {
    return subjects
      .filter((subject) => subject.statusDate || subject.grade !== null || subject.notes)
      .map((subject) => ({
        id: subject.id,
        date: subject.statusDate ?? null,
        name: subject.name,
        planCode: subject.planCode,
        grade: subject.grade,
        notes: subject.notes ?? '',
      }))
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  }, [subjects]);

  const handleCreateRecord = async () => {
    if (!subjectId) return;
    setIsSaving(true);
    setError(null);
    try {
      const gradeValue = grade.trim() === '' ? null : Number(grade);
      const normalizedGrade = Number.isNaN(gradeValue ?? NaN) ? null : gradeValue;
      const difficultyValue = difficulty.trim() === '' ? null : Number(difficulty);
      const normalizedDifficulty = Number.isNaN(difficultyValue ?? NaN) ? null : difficultyValue;
      const statusDateValue = statusDate.trim() === '' ? null : statusDate;
      const notesValue = notes.trim() === '' ? null : notes.trim();

      const response = await authFetch(`${API_URL}/academic-career/subjects/${subjectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          grade: normalizedGrade,
          difficulty: normalizedDifficulty,
          statusDate: statusDateValue,
          notes: notesValue,
        }),
      });

      if (!response.ok) {
        throw new Error('No se pudo guardar el registro.');
      }

      updateSubject(subjectId, {
        status,
        grade: normalizedGrade,
        difficulty: normalizedDifficulty,
        statusDate: statusDateValue,
        notes: notesValue,
      });

      const graphResponse = await authFetch(`${API_URL}/academic-career/graph`);
      if (graphResponse.ok) {
        const graphData = await graphResponse.json();
        if (Array.isArray(graphData)) {
          setSubjects(graphData);
        }
      }

      setGrade('');
      setDifficulty('');
      setStatusDate('');
      setNotes('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperado.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-app bg-elevated p-4 shadow-subtle">
        <h3 className="text-lg font-bold text-app mb-3">Cargar nuevo registro</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-muted">
            Materia
            <select
              className="bg-surface border border-app rounded-lg px-3 py-2 text-app"
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
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
            Nota
            <input
              type="number"
              min={0}
              max={10}
              className="bg-surface border border-app rounded-lg px-3 py-2 text-app"
              value={grade}
              onChange={(event) => setGrade(event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-muted">
            Dificultad
            <input
              type="number"
              min={1}
              max={100}
              className="bg-surface border border-app rounded-lg px-3 py-2 text-app"
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
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
              rows={3}
              className="bg-surface border border-app rounded-lg px-3 py-2 text-app"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <button
          className="mt-4 rounded-lg border border-accent bg-surface px-4 py-2 text-sm text-app"
          onClick={handleCreateRecord}
          disabled={isSaving}
        >
          {isSaving ? 'Guardando...' : 'Guardar registro'}
        </button>
      </div>

      <div className="rounded-2xl border border-app bg-elevated p-4 shadow-subtle">
        <h3 className="text-lg font-bold text-app mb-4">Historia academica</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-app">
                <th className="py-2">Fecha</th>
                <th className="py-2">Materia</th>
                <th className="py-2">Codigo</th>
                <th className="py-2">Nota</th>
                <th className="py-2">Comentario</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted">
                    Todavia no hay registros cargados.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-app/40">
                    <td className="py-3 text-app">{formatDate(row.date)}</td>
                    <td className="py-3 text-app">{row.name}</td>
                    <td className="py-3 text-muted">{row.planCode}</td>
                    <td className="py-3 text-app">{formatGrade(row.grade)}</td>
                    <td className="py-3 text-muted">{row.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
