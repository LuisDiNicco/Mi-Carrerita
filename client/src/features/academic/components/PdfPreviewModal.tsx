import { useState } from 'react';
import { X, Upload, Check, AlertTriangle, Trash2, Edit2 } from 'lucide-react';
import type { ParsedAcademicRecord, BatchAcademicRecordPayload } from '../lib/academic-api';
import { SubjectStatus } from '../../../shared/types/academic';
import { cn } from '../../../shared/lib/utils';

interface PdfPreviewModalProps {
    records: ParsedAcademicRecord[];
    onConfirm: (records: BatchAcademicRecordPayload[]) => Promise<void>;
    onClose: () => void;
}

const STATUS_OPTIONS = [
    { label: 'Aprobada', value: SubjectStatus.APROBADA },
    { label: 'Regularizada', value: SubjectStatus.REGULARIZADA },
    { label: 'En curso', value: SubjectStatus.EN_CURSO },
    { label: 'Recursada', value: SubjectStatus.RECURSADA },
];

/** Convert DD/MM/YYYY to ISO YYYY-MM-DD */
function toIsoDate(ddmmyyyy: string): string | null {
    if (!ddmmyyyy) return null;
    const parts = ddmmyyyy.split('/');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

interface EditableRecord {
    planCode: string;
    name: string;
    status: string;
    grade: string; // kept as string for editing
    date: string; // ISO date for input[type=date]
    acta: string;
    excluded: boolean;
}

export const PdfPreviewModal = ({ records, onConfirm, onClose }: PdfPreviewModalProps) => {
    const [editableRecords, setEditableRecords] = useState<EditableRecord[]>(
        records.map((r) => ({
            planCode: r.planCode,
            name: r.name,
            status: r.grade !== null && r.grade >= 4 ? SubjectStatus.APROBADA : SubjectStatus.REGULARIZADA,
            grade: r.grade !== null ? String(r.grade) : '',
            date: toIsoDate(r.date) || '',
            acta: r.acta,
            excluded: false,
        }))
    );
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateField = (index: number, field: keyof EditableRecord, value: string | boolean) => {
        setEditableRecords((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const toggleExclude = (index: number) => {
        updateField(index, 'excluded', !editableRecords[index].excluded);
    };

    const handleConfirm = async () => {
        setIsSaving(true);
        setError(null);
        try {
            const payload: BatchAcademicRecordPayload[] = editableRecords
                .filter((r) => !r.excluded)
                .map((r) => ({
                    planCode: r.planCode,
                    status: r.status,
                    finalGrade: r.grade.trim() !== '' ? Number(r.grade) : null,
                    statusDate: r.date || null,
                }));

            await onConfirm(payload);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error inesperado.';
            setError(message);
        } finally {
            setIsSaving(false);
        }
    };

    const activeCount = editableRecords.filter((r) => !r.excluded).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-surface border-2 border-app rounded-xl w-full max-w-4xl max-h-[85vh] shadow-retro scale-100 animate-in zoom-in-95 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-elevated p-5 border-b border-app flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-app font-retro tracking-wide flex items-center gap-2">
                            <Upload size={20} /> Vista Previa — Historia Académica
                        </h3>
                        <p className="text-sm text-muted mt-1">
                            Se encontraron <strong className="text-app">{records.length}</strong> registros. Revisá y editá antes de guardar.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-muted hover:text-red-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-auto flex-1 p-4">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-muted border-b border-app bg-surface/50">
                                <th className="py-2 px-3 font-medium w-20">Código</th>
                                <th className="py-2 px-3 font-medium">Materia</th>
                                <th className="py-2 px-3 font-medium w-32">Estado</th>
                                <th className="py-2 px-3 font-medium w-20 text-center">Nota</th>
                                <th className="py-2 px-3 font-medium w-36">Fecha</th>
                                <th className="py-2 px-3 font-medium w-16 text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-app/10">
                            {editableRecords.map((record, index) => (
                                <tr
                                    key={index}
                                    className={cn(
                                        "transition-colors",
                                        record.excluded
                                            ? "opacity-40 bg-red-500/5 line-through"
                                            : "hover:bg-unlam-500/5"
                                    )}
                                >
                                    <td className="py-2 px-3 font-mono text-xs text-muted">{record.planCode}</td>
                                    <td className="py-2 px-3 text-app font-bold text-xs">{record.name}</td>
                                    <td className="py-2 px-3">
                                        <select
                                            className="bg-surface border border-app rounded px-2 py-1 text-xs text-app w-full"
                                            value={record.status}
                                            onChange={(e) => updateField(index, 'status', e.target.value)}
                                            disabled={record.excluded}
                                        >
                                            {STATUS_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                        <input
                                            type="number"
                                            min={0}
                                            max={10}
                                            className="bg-surface border border-app rounded px-2 py-1 text-xs text-app w-16 text-center"
                                            value={record.grade}
                                            onChange={(e) => updateField(index, 'grade', e.target.value)}
                                            disabled={record.excluded}
                                            placeholder="-"
                                        />
                                    </td>
                                    <td className="py-2 px-3">
                                        <input
                                            type="date"
                                            className="bg-surface border border-app rounded px-2 py-1 text-xs text-app w-full"
                                            value={record.date}
                                            onChange={(e) => updateField(index, 'date', e.target.value)}
                                            disabled={record.excluded}
                                        />
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                        <button
                                            onClick={() => toggleExclude(index)}
                                            className={cn(
                                                "p-1.5 rounded-lg transition-colors",
                                                record.excluded
                                                    ? "text-green-500 hover:bg-green-500/10"
                                                    : "text-red-400 hover:bg-red-500/10"
                                            )}
                                            title={record.excluded ? "Incluir" : "Excluir"}
                                        >
                                            {record.excluded ? <Edit2 size={14} /> : <Trash2 size={14} />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="border-t border-app bg-elevated p-4 flex items-center justify-between shrink-0">
                    <div className="text-xs text-muted">
                        {activeCount} de {editableRecords.length} registros seleccionados para guardar
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertTriangle size={14} /> {error}
                        </p>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold text-muted border border-transparent hover:border-app rounded-lg transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isSaving || activeCount === 0}
                            className="px-6 py-2 bg-unlam-500 text-black font-bold tracking-widest rounded-lg hover:bg-unlam-600 disabled:opacity-50 disabled:grayscale transition-all shadow-subtle hover:shadow-md flex items-center gap-2"
                        >
                            <Check size={16} />
                            {isSaving ? 'Guardando...' : `Confirmar (${activeCount})`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
