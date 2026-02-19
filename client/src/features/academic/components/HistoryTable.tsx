import { useEffect, useMemo, useState } from 'react';
import { useAcademicStore } from '../store/academic-store';
import { formatDate, formatGrade } from '../../../shared/lib/utils';
import { authFetch } from '../../auth/lib/api';
import { fetchAcademicGraph } from '../lib/academic-api';
import { SubjectStatus } from '../../../shared/types/academic';
import { Search, ArrowUpDown, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const STATUS_OPTIONS = [
  { label: 'Pendiente', value: SubjectStatus.PENDIENTE },
  { label: 'En curso', value: SubjectStatus.EN_CURSO },
  { label: 'Regularizada', value: SubjectStatus.REGULARIZADA },
  { label: 'Aprobada', value: SubjectStatus.APROBADA },
  { label: 'Recursada', value: SubjectStatus.RECURSADA },
];

type SortKey = 'date' | 'name' | 'grade' | 'act';
type SortDirection = 'asc' | 'desc';

export const HistoryTable = () => {
  const subjects = useAcademicStore((state) => state.subjects);
  const updateSubject = useAcademicStore((state) => state.updateSubject);
  const setSubjects = useAcademicStore((state) => state.setSubjects);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState('');
  const [status, setStatus] = useState<SubjectStatus>(SubjectStatus.APROBADA);
  const [grade, setGrade] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [statusDate, setStatusDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'date',
    direction: 'desc',
  });

  useEffect(() => {
    // Only set default subject if NOT editing and no subject selected
    if (!editingId && subjects.length > 0 && !subjectId) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId, editingId]);

  // Derived Data
  const filteredAndSortedRows = useMemo(() => {
    let data = subjects
      .filter((subject) => subject.statusDate || subject.grade !== null || subject.notes || subject.status !== SubjectStatus.PENDIENTE) // Show all non-pending or modified
      .map((subject) => ({
        id: subject.id,
        date: subject.statusDate ?? '',
        name: subject.name,
        planCode: subject.planCode,
        grade: subject.grade,
        status: subject.status,
        notes: subject.notes ?? '',
        rawSubject: subject,
      }));

    // Filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(
        (row) =>
          row.name.toLowerCase().includes(lower) ||
          row.planCode.toLowerCase().includes(lower) ||
          row.notes.toLowerCase().includes(lower)
      );
    }

    if (filterStatus !== 'ALL') {
      data = data.filter((row) => row.status === filterStatus);
    }

    // Sort
    data.sort((a, b) => {
      let valA: any = a[sortConfig.key as keyof typeof a];
      let valB: any = b[sortConfig.key as keyof typeof b];

      // Handle nulls/undefined
      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [subjects, searchTerm, filterStatus, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    if (subjects.length > 0) setSubjectId(subjects[0].id);
    setStatus(SubjectStatus.APROBADA);
    setGrade('');
    setDifficulty('');
    setStatusDate('');
    setNotes('');
    setError(null);
  };

  const handleEdit = (row: any) => {
    const s = row.rawSubject;
    setEditingId(s.id);
    setSubjectId(s.id);
    setStatus(s.status);
    setGrade(s.grade !== null ? String(s.grade) : '');
    setDifficulty(s.difficulty !== null ? String(s.difficulty) : '');
    // Ensure date format YYYY-MM-DD
    const dateStr = s.statusDate ? new Date(s.statusDate).toISOString().split('T')[0] : '';
    setStatusDate(dateStr);
    setNotes(s.notes || '');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el historial de "${name}"? \nEsto restablecerá la materia a PENDIENTE.`)) return;

    try {
      // Logic to reset subject. Could be a specific endpoint or just update to PENDIENTE with nulls.
      // Assuming PATCH supports resetting or we have to manually set nulls.
      // Usually "Delete history" means reset to initial state.

      const response = await authFetch(`${API_URL}/academic-career/subjects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: SubjectStatus.PENDIENTE,
          grade: null,
          difficulty: null,
          statusDate: null,
          notes: null
        }),
      });

      if (!response.ok) throw new Error('Error al eliminar registro');

      updateSubject(id, {
        status: SubjectStatus.PENDIENTE,
        grade: null,
        difficulty: null,
        statusDate: null,
        notes: null
      });

      // Refresh graph to be safe
      const graphData = await fetchAcademicGraph();
      setSubjects(graphData);

    } catch (err) {
      alert("No se pudo eliminar el registro.");
    }
  };

  const handleSave = async () => {
    if (!subjectId) return;
    setIsSaving(true);
    setError(null);
    try {
      const gradeValue = grade.trim() === '' ? null : Number(grade);
      const normalizedGrade = Number.isNaN(gradeValue ?? NaN) ? null : gradeValue;
      // Validate Grade vs Status
      if (status === SubjectStatus.APROBADA && normalizedGrade === null) {
        // Allow it, but maybe warn? Or strict?
        // Let's allow flexibility but generally Approved should have grade.
      }

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

      const graphData = await fetchAcademicGraph();
      setSubjects(graphData);

      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperado.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">

      {/* Editor Form */}
      <div className={cn(
        "rounded-2xl border transition-all duration-300 p-5 shadow-subtle",
        editingId ? "border-unlam-500 bg-unlam-500/5 ring-1 ring-unlam-500/30" : "border-app bg-elevated"
      )}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-app flex items-center gap-2">
            {editingId ? <><Edit2 size={18} /> Editando Registro</> : 'Cargar Nuevo Registro'}
          </h3>
          {editingId && (
            <button onClick={resetForm} className="text-sm text-muted hover:text-red-500 flex items-center gap-1">
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
            Fecha
            <input
              type="date"
              className="bg-surface border border-app rounded-lg px-3 py-2 text-app"
              value={statusDate}
              onChange={(event) => setStatusDate(event.target.value)}
            />
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

        {error && <p className="mt-3 text-sm text-red-500 flex items-center gap-2"><AlertTriangle size={14} /> {error}</p>}

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

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-elevated/50 p-4 rounded-xl border border-app">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input
            type="text"
            placeholder="Buscar materia..."
            className="w-full pl-9 pr-4 py-2 bg-surface border border-app rounded-lg text-sm focus:ring-1 focus:ring-unlam-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {['ALL', SubjectStatus.APROBADA, SubjectStatus.EN_CURSO, SubjectStatus.REGULARIZADA].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border",
                filterStatus === st
                  ? "bg-app-text text-app-bg border-app-text"
                  : "bg-surface text-muted border-app hover:border-app-text"
              )}
            >
              {st === 'ALL' ? 'Todos' : STATUS_OPTIONS.find(o => o.value === st)?.label || st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-app bg-elevated shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-app bg-surface/50">
                <th
                  className="py-3 px-4 font-medium cursor-pointer hover:text-app transition-colors select-none group"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">Fecha {sortConfig.key === 'date' && <ArrowUpDown size={12} className="text-unlam-500" />}</div>
                </th>
                <th
                  className="py-3 px-4 font-medium cursor-pointer hover:text-app transition-colors select-none group"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">Materia {sortConfig.key === 'name' && <ArrowUpDown size={12} className="text-unlam-500" />}</div>
                </th>
                <th className="py-3 px-4 font-medium">Estado</th>
                <th
                  className="py-3 px-4 font-medium cursor-pointer hover:text-app transition-colors select-none group"
                  onClick={() => handleSort('grade')}
                >
                  <div className="flex items-center gap-1">Nota {sortConfig.key === 'grade' && <ArrowUpDown size={12} className="text-unlam-500" />}</div>
                </th>
                <th className="py-3 px-4 font-medium">Comentario</th>
                <th className="py-3 px-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app/10">
              {filteredAndSortedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted">
                    No se encontraron registros.
                  </td>
                </tr>
              ) : (
                filteredAndSortedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-app-text/5 transition-colors group">
                    <td className="py-3 px-4 text-app font-mono text-xs">{formatDate(row.date) || '-'}</td>
                    <td className="py-3 px-4 text-app font-medium">
                      {row.name}
                      <span className="block text-[10px] text-muted">{row.planCode}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
                        row.status === SubjectStatus.APROBADA ? "bg-green-500/20 text-green-500" :
                          row.status === SubjectStatus.REGULARIZADA ? "bg-yellow-500/20 text-yellow-500" :
                            row.status === SubjectStatus.EN_CURSO ? "bg-blue-500/20 text-blue-500" :
                              row.status === SubjectStatus.RECURSADA ? "bg-red-500/20 text-red-500" :
                                "bg-gray-500/20 text-gray-400"
                      )}>
                        {STATUS_OPTIONS.find(o => o.value === row.status)?.label || row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-app font-bold font-mono">{formatGrade(row.grade)}</td>
                    <td className="py-3 px-4 text-muted text-xs max-w-[200px] truncate" title={row.notes}>
                      {row.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(row)}
                          className="p-1.5 text-muted hover:text-unlam-500 hover:bg-unlam-500/10 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(row.id, row.name)}
                          className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Eliminar historial"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
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
