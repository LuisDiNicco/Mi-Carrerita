import { useEffect, useMemo, useRef, useState } from 'react';
import { useAcademicStore } from '../store/academic-store';
import { formatDate, formatGrade, fromISODate, toISODate } from '../../../shared/lib/utils';
import { authFetch } from '../../auth/lib/api';
import { fetchAcademicGraph } from '../lib/academic-api';
import { SubjectStatus } from '../../../shared/types/academic';
import { useAuthStore } from '../../auth/store/auth-store';
import { Search, ArrowUpDown, Edit2, Trash2, X, AlertTriangle, Upload, Calendar } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { RetroCalendar } from '../../../shared/ui';
import { uploadHistoriaPdf, batchSaveHistory } from '../lib/academic-api';
import type { ParsedAcademicRecord, BatchAcademicRecordPayload } from '../lib/academic-api';
import { PdfPreviewModal } from './PdfPreviewModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const STATUS_OPTIONS = [
  { label: 'Pendiente', value: SubjectStatus.PENDIENTE },
  { label: 'En curso', value: SubjectStatus.EN_CURSO },
  { label: 'Regularizada', value: SubjectStatus.REGULARIZADA },
  { label: 'Aprobada', value: SubjectStatus.APROBADA },
  { label: 'Recursada', value: SubjectStatus.RECURSADA },
];

type SortKey = 'date' | 'name' | 'grade' | 'planCode' | 'year' | 'difficulty';
type SortDirection = 'asc' | 'desc';

export const HistoryTable = () => {
  const subjects = useAcademicStore((state) => state.subjects);
  const updateSubject = useAcademicStore((state) => state.updateSubject);
  const setSubjectsFromServer = useAcademicStore((state) => state.setSubjectsFromServer);
  const isGuest = useAuthStore((state) => state.isGuest);

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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // PDF Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedRecords, setParsedRecords] = useState<ParsedAcademicRecord[] | null>(null);

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'date',
    direction: 'desc',
  });
  // Inline delete confirmation state
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    // Only set default subject if NOT editing and no subject selected
    if (!editingId && subjects.length > 0 && !subjectId) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId, editingId]);

  // Derived Data
  const filteredAndSortedRows = useMemo(() => {
    let data = subjects
      .filter((subject) => subject.statusDate || subject.grade !== null || subject.notes || (subject.status !== SubjectStatus.PENDIENTE && subject.status !== SubjectStatus.DISPONIBLE))
      .map((subject) => ({
        id: subject.id,
        date: subject.statusDate ?? '',
        name: subject.name,
        planCode: subject.planCode,
        year: subject.year,
        grade: subject.grade,
        difficulty: subject.difficulty ?? null,
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
    setDifficulty(s.difficulty !== null && s.difficulty !== undefined ? String(s.difficulty) : '');
    // Convert ISO date to DD/MM/YYYY for the input
    const dateStr = s.statusDate ? fromISODate(new Date(s.statusDate).toISOString().split('T')[0]) : '';
    setStatusDate(dateStr);
    setNotes(s.notes || '');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, name: string) => {
    setPendingDelete({ id, name });
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setPendingDelete(null);

    if (isGuest) {
      updateSubject(id, {
        status: SubjectStatus.PENDIENTE,
        grade: null,
        difficulty: null,
        statusDate: null,
        notes: null,
      });
      return;
    }

    try {
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

      const graphData = await fetchAcademicGraph();
      setSubjectsFromServer(graphData);
    } catch (err) {
      setDeleteError('No se pudo eliminar el registro. Intentá de nuevo.');
    }
  };

  const handleSave = async () => {
    if (!subjectId) return;
    setIsSaving(true);
    setError(null);
    try {
      // === Validations (same as SubjectUpdatePanel) ===
      if (status === SubjectStatus.APROBADA && grade.trim() === '') {
        setError('La nota es obligatoria para materias Aprobadas.');
        setIsSaving(false);
        return;
      }
      if (grade.trim() !== '') {
        const g = Number(grade);
        if (Number.isNaN(g) || g < 1 || g > 10) {
          setError('La nota debe ser un número entre 1 y 10.');
          setIsSaving(false);
          return;
        }
      }
      if (difficulty.trim() !== '') {
        const d = Number(difficulty);
        if (Number.isNaN(d) || d < 1 || d > 100) {
          setError('La dificultad debe ser un número entre 1 y 100.');
          setIsSaving(false);
          return;
        }
      }
      // =============================================

      const gradeValue = grade.trim() === '' ? null : Number(grade);
      const normalizedGrade = Number.isNaN(gradeValue ?? NaN) ? null : gradeValue;
      const difficultyValue = difficulty.trim() === '' ? null : Number(difficulty);
      const normalizedDifficulty = Number.isNaN(difficultyValue ?? NaN) ? null : difficultyValue;
      // Convert DD/MM/YYYY → ISO for API
      const isoDate = statusDate.trim() === '' ? null : toISODate(statusDate);
      const statusDateValue = isoDate || null;
      const notesValue = notes.trim() === '' ? null : notes.trim();

      if (!isGuest) {
        const response = await authFetch(`${API_URL}/academic-career/subjects/${subjectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status,
            grade: normalizedGrade,
            difficulty: normalizedDifficulty,
            statusDate: statusDateValue,
            notes: notesValue,
          }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.message || 'No se pudo guardar el registro.');
        }
      }

      updateSubject(subjectId, {
        status,
        grade: normalizedGrade,
        difficulty: normalizedDifficulty,
        statusDate: statusDateValue,
        notes: notesValue,
      });

      if (!isGuest) {
        const graphData = await fetchAcademicGraph();
        setSubjectsFromServer(graphData);
      }

      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperado.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  // PDF Upload Handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so re-uploading the same file works
    e.target.value = '';

    setIsUploading(true);
    setError(null);
    try {
      const result = await uploadHistoriaPdf(file);
      if (result.data.length === 0) {
        setError('No se encontraron registros en el PDF. Verificá que sea un PDF válido de Historia Académica.');
        return;
      }
      setParsedRecords(result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al procesar el PDF.';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleBatchConfirm = async (records: BatchAcademicRecordPayload[]) => {
    await batchSaveHistory(records);
    setParsedRecords(null);
    // Refresh the graph after batch save
    if (!isGuest) {
      const graphData = await fetchAcademicGraph();
      setSubjectsFromServer(graphData);
    }
  };

  return (
    <div className="space-y-6 pb-20">

      {/* Inline Delete Confirmation */}
      {pendingDelete && (
        <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-5 py-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between shadow-subtle animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-app text-sm">¿Eliminar historial?</p>
              <p className="text-xs text-muted mt-0.5">
                Se borrará el registro de <strong className="text-app">{pendingDelete.name}</strong> y la materia volverá a estado <strong className="text-app">PENDIENTE</strong>.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setPendingDelete(null)}
              className="px-4 py-1.5 rounded-lg border border-app text-app text-xs font-bold hover:bg-elevated transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors"
            >
              Confirmar Eliminación
            </button>
          </div>
        </div>
      )}

      {/* Inline Delete Error */}
      {deleteError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-bold">
          <AlertTriangle size={16} />
          {deleteError}
          <button onClick={() => setDeleteError(null)} className="ml-auto text-muted hover:text-app">×</button>
        </div>
      )}

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
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              type="text"
              placeholder="Buscar materia..."
              className="w-full pl-9 pr-4 py-2 bg-surface border border-app rounded-lg text-sm focus:ring-1 focus:ring-unlam-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-unlam-500/50 text-unlam-500 hover:bg-unlam-500/10 hover:border-unlam-500 transition-all font-bold text-sm whitespace-nowrap disabled:opacity-50"
          >
            <Upload size={16} />
            {isUploading ? 'Procesando...' : 'Subir PDF'}
          </button>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide flex-nowrap">
          {['ALL', SubjectStatus.APROBADA, SubjectStatus.EN_CURSO, SubjectStatus.REGULARIZADA, SubjectStatus.RECURSADA].map((st) => {
            const label = st === 'ALL' ? 'Todos' : STATUS_OPTIONS.find(o => o.value === st)?.label || st;

            return (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border-2 shadow-subtle min-w-[max-content]",
                  filterStatus === st
                    ? "bg-unlam-500 text-app-accent-ink border-unlam-500"
                    : "bg-surface text-muted border-app hover:border-unlam-500/50 hover:text-app"
                )}
              >
                {label}
              </button>
            )
          })}
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
                  className="py-3 px-4 font-medium cursor-pointer hover:text-app transition-colors select-none group w-20 text-center"
                  onClick={() => handleSort('planCode')}
                >
                  <div className="flex items-center gap-1">Código {sortConfig.key === 'planCode' && <ArrowUpDown size={12} className="text-unlam-500" />}</div>
                </th>
                <th
                  className="py-3 px-4 font-medium cursor-pointer hover:text-app transition-colors select-none group w-16 text-center"
                  onClick={() => handleSort('year')}
                >
                  <div className="flex items-center gap-1">Año {sortConfig.key === 'year' && <ArrowUpDown size={12} className="text-unlam-500" />}</div>
                </th>
                <th
                  className="py-3 px-4 font-medium cursor-pointer hover:text-app transition-colors select-none group"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">Materia {sortConfig.key === 'name' && <ArrowUpDown size={12} className="text-unlam-500" />}</div>
                </th>
                <th className="py-3 px-4 font-medium">Estado</th>
                <th
                  className="py-3 px-4 font-medium cursor-pointer hover:text-app transition-colors select-none group w-20 text-center"
                  onClick={() => handleSort('grade')}
                >
                  <div className="flex items-center justify-center gap-1">Nota {sortConfig.key === 'grade' && <ArrowUpDown size={12} className="text-unlam-500" />}</div>
                </th>
                <th
                  className="py-3 px-4 font-medium cursor-pointer hover:text-app transition-colors select-none group w-20 text-center"
                  onClick={() => handleSort('difficulty')}
                >
                  <div className="flex items-center justify-center gap-1">Dific. {sortConfig.key === 'difficulty' && <ArrowUpDown size={12} className="text-unlam-500" />}</div>
                </th>
                <th className="py-3 px-4 font-medium">Comentario</th>
                <th className="py-3 px-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app/10">
              {filteredAndSortedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted">
                    No se encontraron registros.
                  </td>
                </tr>
              ) : (
                filteredAndSortedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-unlam-500/5 transition-colors group">
                    <td className="py-3 px-4 text-app font-mono text-xs">{formatDate(row.date) || '-'}</td>
                    <td className="py-3 px-4 text-muted font-mono text-xs">{row.planCode}</td>
                    <td className="py-3 px-4 text-muted font-mono text-xs text-center">{row.year}º</td>
                    <td className="py-3 px-4 text-app font-bold">{row.name}</td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border",
                        row.status === SubjectStatus.APROBADA ? "bg-green-500/10 text-green-500 border-green-500/30" :
                          row.status === SubjectStatus.REGULARIZADA ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/30" :
                            row.status === SubjectStatus.EN_CURSO ? "bg-blue-500/10 text-blue-500 border-blue-500/30" :
                              row.status === SubjectStatus.RECURSADA ? "bg-red-500/10 text-red-500 border-red-500/30" :
                                "bg-gray-500/10 text-gray-400 border-gray-500/30"
                      )}>
                        {STATUS_OPTIONS.find(o => o.value === row.status)?.label || row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-app font-bold font-mono text-center">{formatGrade(row.grade)}</td>
                    <td className="py-3 px-4 text-center">
                      {row.difficulty !== null && row.difficulty !== undefined ? (
                        <span className={cn(
                          'inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono',
                          row.difficulty >= 67 ? 'bg-red-500/10 text-red-400' :
                            row.difficulty >= 34 ? 'bg-yellow-500/10 text-yellow-400' :
                              'bg-green-500/10 text-green-400'
                        )}>{row.difficulty}</span>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td className="py-3 px-4 relative max-w-[200px] group/tooltip">
                      <div className="truncate text-xs text-muted">
                        {row.notes || '—'}
                      </div>
                      {/* Hover Preview Tooltip */}
                      {row.notes && (
                        <div className="absolute left-0 bottom-full mb-1 w-max max-w-[250px] p-3 rounded-lg bg-surface border border-unlam-500 shadow-retro text-xs text-app opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-10 whitespace-normal">
                          {row.notes}
                        </div>
                      )}
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

      {/* PDF Preview Modal */}
      {parsedRecords && (
        <PdfPreviewModal
          records={parsedRecords}
          onConfirm={handleBatchConfirm}
          onClose={() => setParsedRecords(null)}
        />
      )}
    </div>
  );
};
