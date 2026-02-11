import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useAcademicStore } from '../academic/store/academic-store';
import { SubjectStatus } from '../../shared/types/academic';

const CHART_COLORS = {
  approved: '#7BCB7A',
  regular: '#B4E6A6',
  inProgress: '#8FB5DD',
  available: '#F7E8A3',
  pending: '#8A9B8A',
};

const DEFAULT_LOAD = 4;
const CHART_HEIGHTS = {
  status: 260,
  semester: 288,
  line: 260,
};
const BAR_SIZE = 18;
const DIFFICULTY_RANK_LIMIT = 6;

export const Dashboard = () => {
  const subjects = useAcademicStore((state) => state.subjects);
  const [targetLoad, setTargetLoad] = useState(DEFAULT_LOAD);

  const statusData = useMemo(() => {
    const counts = {
      approved: 0,
      regular: 0,
      inProgress: 0,
      available: 0,
      pending: 0,
    };

    subjects.forEach((subject) => {
      switch (subject.status) {
        case SubjectStatus.APROBADA:
          counts.approved += 1;
          break;
        case SubjectStatus.REGULARIZADA:
          counts.regular += 1;
          break;
        case SubjectStatus.EN_CURSO:
          counts.inProgress += 1;
          break;
        case SubjectStatus.DISPONIBLE:
          counts.available += 1;
          break;
        default:
          counts.pending += 1;
      }
    });

    return [
      { name: 'Aprobadas', value: counts.approved, color: CHART_COLORS.approved },
      { name: 'Regularizadas', value: counts.regular, color: CHART_COLORS.regular },
      { name: 'En curso', value: counts.inProgress, color: CHART_COLORS.inProgress },
      { name: 'Disponibles', value: counts.available, color: CHART_COLORS.available },
      { name: 'Pendientes', value: counts.pending, color: CHART_COLORS.pending },
    ];
  }, [subjects]);

  const semesterData = useMemo(() => {
    const map = new Map<number, { semester: number; approved: number; inProgress: number; available: number }>();

    subjects.forEach((subject) => {
      const entry = map.get(subject.semester) ?? {
        semester: subject.semester,
        approved: 0,
        inProgress: 0,
        available: 0,
      };

      if (subject.status === SubjectStatus.APROBADA) entry.approved += 1;
      if (subject.status === SubjectStatus.EN_CURSO) entry.inProgress += 1;
      if (subject.status === SubjectStatus.DISPONIBLE) entry.available += 1;

      map.set(subject.semester, entry);
    });

    return Array.from(map.values()).sort((a, b) => a.semester - b.semester);
  }, [subjects]);

  const approvalsByYear = useMemo(() => {
    const map = new Map<number, number>();

    subjects.forEach((subject) => {
      if (subject.status !== SubjectStatus.APROBADA) return;
      if (!subject.statusDate) return;
      const year = new Date(subject.statusDate + 'T00:00:00').getFullYear();
      map.set(year, (map.get(year) ?? 0) + 1);
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, count]) => ({ year: String(year), aprobadas: count }));
  }, [subjects]);

  const gradeTrend = useMemo(() => {
    const map = new Map<number, { sum: number; count: number }>();

    subjects.forEach((subject) => {
      if (subject.grade === null) return;
      if (!subject.statusDate) return;
      const year = new Date(subject.statusDate + 'T00:00:00').getFullYear();
      const entry = map.get(year) ?? { sum: 0, count: 0 };
      entry.sum += subject.grade;
      entry.count += 1;
      map.set(year, entry);
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, entry]) => ({ year: String(year), promedio: Number((entry.sum / entry.count).toFixed(2)) }));
  }, [subjects]);

  const projection = useMemo(() => {
    const remaining = subjects.filter((subject) => subject.status !== SubjectStatus.APROBADA).length;
    const normalizedLoad = Math.max(1, targetLoad);
    const semesters = Math.ceil(remaining / normalizedLoad);
    return { remaining, semesters };
  }, [subjects, targetLoad]);

  const difficultyRanking = useMemo(() => {
    return subjects
      .filter((subject) => subject.difficulty !== null && subject.difficulty !== undefined)
      .sort((a, b) => (b.difficulty ?? 0) - (a.difficulty ?? 0))
      .slice(0, DIFFICULTY_RANK_LIMIT);
  }, [subjects]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-app bg-elevated p-4 shadow-subtle">
          <h3 className="text-lg font-bold text-app mb-3">Estado general</h3>
          <div style={{ height: CHART_HEIGHTS.status }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-app bg-elevated p-4 shadow-subtle">
          <h3 className="text-lg font-bold text-app mb-3">Proyeccion</h3>
          <div className="space-y-3 text-sm text-muted">
            <p>
              Materias restantes: <span className="text-app font-bold">{projection.remaining}</span>
            </p>
            <label className="flex flex-col gap-2">
              Materias por cuatrimestre
              <input
                type="number"
                min={1}
                className="bg-surface border border-app rounded-lg px-3 py-2 text-app"
                value={targetLoad}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setTargetLoad(Number.isNaN(next) ? DEFAULT_LOAD : next);
                }}
              />
            </label>
            <p className="text-app font-semibold">
              Proyeccion: {projection.semesters} cuatrimestres
            </p>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-app bg-elevated p-4 shadow-subtle">
        <h3 className="text-lg font-bold text-app mb-3">Materias por semestre</h3>
        <div style={{ height: CHART_HEIGHTS.semester }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={semesterData} barSize={BAR_SIZE}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2E3A2E" />
              <XAxis dataKey="semester" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="approved" name="Aprobadas" fill={CHART_COLORS.approved} />
              <Bar dataKey="inProgress" name="En curso" fill={CHART_COLORS.inProgress} />
              <Bar dataKey="available" name="Disponibles" fill={CHART_COLORS.available} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-app bg-elevated p-4 shadow-subtle">
          <h3 className="text-lg font-bold text-app mb-3">Aprobadas por anio</h3>
          <div style={{ height: CHART_HEIGHTS.line }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={approvalsByYear}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E3A2E" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="aprobadas" stroke={CHART_COLORS.approved} strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-app bg-elevated p-4 shadow-subtle">
          <h3 className="text-lg font-bold text-app mb-3">Promedio de notas</h3>
          <div style={{ height: CHART_HEIGHTS.line }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gradeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E3A2E" />
                <XAxis dataKey="year" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Line type="monotone" dataKey="promedio" stroke={CHART_COLORS.inProgress} strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-app bg-elevated p-4 shadow-subtle">
        <h3 className="text-lg font-bold text-app mb-3">Ranking de dificultad</h3>
        {difficultyRanking.length === 0 ? (
          <p className="text-sm text-muted">Todavia no hay materias con dificultad cargada.</p>
        ) : (
          <div className="space-y-2">
            {difficultyRanking.map((subject) => (
              <div
                key={subject.id}
                className="flex items-center justify-between rounded-lg border border-app bg-surface px-3 py-2"
              >
                <div>
                  <p className="text-sm text-app font-semibold">{subject.name}</p>
                  <p className="text-xs text-muted">{subject.planCode}</p>
                </div>
                <span className="text-sm font-bold text-app">{subject.difficulty}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
