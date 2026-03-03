import { ArrowUpDown, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { cn, formatDate, formatGrade } from '../../../shared/lib/utils';
import { STATUS_OPTIONS } from '../hooks/useHistoryTable';
import type { SortKey, SortDirection } from '../hooks/useHistoryTable';
import { SubjectStatus } from '../../../shared/types/academic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface HistoryGridRow {
    id: string;
    date: string;
    name: string;
    planCode: string;
    year: number;
    grade: number | null;
    difficulty: number | null;
    status: SubjectStatus;
    notes: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rawSubject: any;
}

interface HistoryGridProps {
    rows: HistoryGridRow[];
    sortConfig: { key: SortKey; direction: SortDirection };
    handleSort: (key: SortKey) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleEdit: (row: any) => void;
    handleDelete: (id: string, name: string) => void;
    pendingDelete: { id: string; name: string } | null;
    confirmDelete: () => Promise<void>;
    setPendingDelete: (val: { id: string; name: string } | null) => void;
    deleteError: string | null;
    setDeleteError: (val: string | null) => void;
}

export function HistoryGrid({
    rows,
    sortConfig,
    handleSort,
    handleEdit,
    handleDelete,
    pendingDelete,
    confirmDelete,
    setPendingDelete,
    deleteError,
    setDeleteError
}: HistoryGridProps) {
    return (
        <>
            {/* Inline Delete Confirmation */}
            {pendingDelete && (
                <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-5 py-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between shadow-subtle animate-in fade-in duration-200">
                    <div className="flex items-start gap-3">
                        <AlertTriangle size={18} className="text-destructive shrink-0 mt-0.5" />
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
                            className="px-4 py-1.5 rounded-lg bg-destructive text-white text-xs font-bold hover:bg-destructive transition-colors"
                        >
                            Confirmar Eliminación
                        </button>
                    </div>
                </div>
            )}

            {/* Inline Delete Error */}
            {deleteError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm font-bold">
                    <AlertTriangle size={16} />
                    {deleteError}
                    <button onClick={() => setDeleteError(null)} className="ml-auto text-muted hover:text-app">í—</button>
                </div>
            )}

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
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-muted">
                                        No se encontraron registros.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => (
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
                                                        row.status === SubjectStatus.EN_CURSO ? "bg-primary/10 text-primary border-primary/30" :
                                                            row.status === SubjectStatus.RECURSADA ? "bg-destructive/10 text-destructive border-destructive/30" :
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
                                                    row.difficulty >= 67 ? 'bg-destructive/10 text-destructive' :
                                                        row.difficulty >= 34 ? 'bg-yellow-500/10 text-yellow-400' :
                                                            'bg-green-500/10 text-green-400'
                                                )}>{row.difficulty}</span>
                                            ) : <span className="text-muted">€”</span>}
                                        </td>
                                        <td className="py-3 px-4 relative max-w-[200px] group/tooltip">
                                            <div className="truncate text-xs text-muted">
                                                {row.notes || '€”'}
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
                                                    className="p-1.5 text-muted hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
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
        </>
    );
}

