import { useMemo } from 'react';
import { useAcademicStore } from '../store/academic-store';
import { formatDate, formatGrade } from '../lib/utils';

export const HistoryTable = () => {
  const subjects = useAcademicStore((state) => state.subjects);

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

  return (
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
  );
};
