import { useEffect, useMemo, useRef, useState } from 'react';
import { useAcademicStore } from '../store/academic-store';
import { fromISODate, toISODate } from '../../../shared/lib/utils';
import { authFetch } from '../../auth/lib/api';
import { fetchAcademicGraph, uploadHistoriaPdf, batchSaveHistory } from '../lib/academic-api';
import { SubjectStatus } from '../../../shared/types/academic';
import { useAuthStore } from '../../auth/store/auth-store';
import type { ParsedAcademicRecord, BatchAcademicRecordPayload } from '../lib/academic-api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export type SortKey = 'date' | 'name' | 'grade' | 'planCode' | 'year' | 'difficulty';
export type SortDirection = 'asc' | 'desc';

export const STATUS_OPTIONS = [
    { label: 'Pendiente', value: SubjectStatus.PENDIENTE },
    { label: 'En curso', value: SubjectStatus.EN_CURSO },
    { label: 'Regularizada', value: SubjectStatus.REGULARIZADA },
    { label: 'Aprobada', value: SubjectStatus.APROBADA },
    { label: 'Recursada', value: SubjectStatus.RECURSADA },
];

export function useHistoryTable() {
    const subjects = useAcademicStore((state) => state.subjects);
    const updateSubject = useAcademicStore((state) => state.updateSubject);
    const setSubjects = useAcademicStore((state) => state.setSubjects);
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let valA: any = a[sortConfig.key as keyof typeof a];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleEdit = (row: typeof filteredAndSortedRows[0]) => {
        const s = row.rawSubject;
        setEditingId(s.id);
        setSubjectId(s.id);
        setStatus(s.status);
        setGrade(s.grade !== null ? String(s.grade) : '');
        setDifficulty(s.difficulty !== null && s.difficulty !== undefined ? String(s.difficulty) : '');
        const dateStr = s.statusDate ? fromISODate(new Date(s.statusDate).toISOString().split('T')[0]) : '';
        setStatusDate(dateStr);
        setNotes(s.notes || '');
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

            const gradeValue = grade.trim() === '' ? null : Number(grade);
            const normalizedGrade = Number.isNaN(gradeValue ?? NaN) ? null : gradeValue;
            const difficultyValue = difficulty.trim() === '' ? null : Number(difficulty);
            const normalizedDifficulty = Number.isNaN(difficultyValue ?? NaN) ? null : difficultyValue;
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

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        setIsUploading(true);
        setError(null);
        try {
            const result = await uploadHistoriaPdf(file, { guestMode: isGuest });
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
        if (isGuest) {
            const recordsByPlanCode = new Map(records.map((r) => [r.planCode, r]));
            const nextSubjects = subjects.map((subject) => {
                const record = recordsByPlanCode.get(subject.planCode);
                if (!record) return subject;
                return {
                    ...subject,
                    status: record.status as SubjectStatus,
                    grade: record.finalGrade ?? null,
                    statusDate: record.statusDate ?? null,
                };
            });
            setSubjects(nextSubjects);
            setParsedRecords(null);
            return;
        }

        await batchSaveHistory(records);
        setParsedRecords(null);
        const graphData = await fetchAcademicGraph();
        setSubjectsFromServer(graphData);
    };

    return {
        subjects,
        editingId,
        subjectId, setSubjectId,
        status, setStatus,
        grade, setGrade,
        difficulty, setDifficulty,
        statusDate, setStatusDate,
        notes, setNotes,
        isSaving,
        error, setError,
        isCalendarOpen, setIsCalendarOpen,
        fileInputRef,
        isUploading,
        parsedRecords, setParsedRecords,
        searchTerm, setSearchTerm,
        filterStatus, setFilterStatus,
        sortConfig,
        pendingDelete, setPendingDelete,
        deleteError, setDeleteError,
        filteredAndSortedRows,
        handleSort,
        resetForm,
        handleEdit,
        handleDelete,
        confirmDelete,
        handleSave,
        handleFileSelect,
        handleBatchConfirm,
    };
}

