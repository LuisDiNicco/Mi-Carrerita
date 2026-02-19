import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
} from 'recharts';
import { useAcademicStore } from '../academic/store/academic-store';
import { SubjectStatus } from '../../shared/types/academic';
import { fetchDashboardData } from './lib/dashboard-api';
import type { DashboardDataDto } from './lib/dashboard-api';

const CHART_COLORS = {
  approved: '#7BCB7A',
  regular: '#B4E6A6',
  inProgress: '#8FB5DD',
  available: '#F7E8A3',
  pending: '#8A9B8A',
  fail: '#FCA5A5',
  difficulty: '#FDE047',
};

const STATUS_LABELS: Record<string, string> = {
  [SubjectStatus.APROBADA]: 'Aprobada',
  [SubjectStatus.REGULARIZADA]: 'Regularizada',
  [SubjectStatus.EN_CURSO]: 'En curso',
  [SubjectStatus.DISPONIBLE]: 'Disponible',
  [SubjectStatus.PENDIENTE]: 'Pendiente',
};

const DEFAULT_LOAD = 4;
const CHART_HEIGHTS = {
  status: 300,
  semester: 300,
  line: 300,
  scatter: 300,
};

// Formatting helpers
// eslint-disable-next-line @typescript-eslint/no-explicit-any


export const Dashboard = () => {
  const subjects = useAcademicStore((state) => state.subjects);
  const [dashboardData, setDashboardData] = useState<DashboardDataDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [targetLoad, setTargetLoad] = useState(DEFAULT_LOAD);
  const [showIntermediateList, setShowIntermediateList] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchDashboardData();
        setDashboardData(data);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError("No se pudieron cargar los datos del tablero.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Intermediate computations maintained from store (since backend doesn't provide this specific view yet)
  const intermediateSubjects = useMemo(
    () => subjects.filter((subject) => subject.isIntermediateDegree),
    [subjects]
  );

  const intermediateStats = useMemo(() => {
    const total = intermediateSubjects.length;
    const approved = intermediateSubjects.filter((subject) => subject.status === SubjectStatus.APROBADA).length;
    const remaining = Math.max(0, total - approved);
    const progress = total > 0 ? Math.round((approved / total) * 100) : 0;
    return { total, approved, remaining, progress };
  }, [intermediateSubjects]);

  // Projection based on summary data
  const projection = useMemo(() => {
    if (!dashboardData?.summary) return { remaining: 0, semesters: 0 };
    const { totalSubjects, completedSubjects } = dashboardData.summary;
    const remaining = totalSubjects - completedSubjects;
    const normalizedLoad = Math.max(1, targetLoad);
    const semesters = Math.ceil(remaining / normalizedLoad);
    return { remaining, semesters };
  }, [dashboardData, targetLoad]);

  const volumeData = useMemo(() => {
    if (!dashboardData?.subjectVolumeChart) return [];
    return dashboardData.subjectVolumeChart.data.map(item => ({
      name: STATUS_LABELS[item.status] || item.status,
      value: item.count,
      color: Object.values(SubjectStatus).includes(item.status as SubjectStatus)
        ? CHART_COLORS[item.status === SubjectStatus.APROBADA ? 'approved' :
          item.status === SubjectStatus.REGULARIZADA ? 'regular' :
            item.status === SubjectStatus.EN_CURSO ? 'inProgress' :
              item.status === SubjectStatus.DISPONIBLE ? 'available' : 'pending']
        : CHART_COLORS.pending
    }));
  }, [dashboardData]);

  if (loading) return <div className="p-8 text-center text-muted">Cargando tablero...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!dashboardData) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-app bg-elevated p-4">
          <p className="text-sm text-muted">Progreso General</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-app">{dashboardData.summary.completionPercentage}%</h3>
            <span className="text-xs text-muted">{dashboardData.summary.completedSubjects}/{dashboardData.summary.totalSubjects} materias</span>
          </div>
        </div>
        <div className="rounded-xl border border-app bg-elevated p-4">
          <p className="text-sm text-muted">Promedio General</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-app">{dashboardData.summary.overallAverageGrade?.toFixed(2) ?? '-'}</h3>
            <span className="text-xs text-muted">Nota final</span>
          </div>
        </div>
        <div className="rounded-xl border border-app bg-elevated p-4">
          <p className="text-sm text-muted">Tasa de Exito</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-app">{dashboardData.summary.overallSuccessRate}%</h3>
            <span className="text-xs text-muted">Materias aprobadas</span>
          </div>
        </div>
        <div className="rounded-xl border border-app bg-elevated p-4">
          <p className="text-sm text-muted">Horas Totales</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-app">{dashboardData.summary.completedHours}</h3>
            <span className="text-xs text-muted">de {dashboardData.summary.totalHours} hs</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-app bg-elevated p-4 shadow-subtle">
          <h3 className="text-lg font-bold text-app mb-3">Distribucion de Materias</h3>
          <div style={{ height: CHART_HEIGHTS.status }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={volumeData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {volumeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
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
          <div className="space-y-4">
            <div className="bg-surface p-4 rounded-xl border border-app">
              <p className="text-sm text-muted mb-1">Materias Restantes</p>
              <p className="text-2xl font-bold text-app">{projection.remaining}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted block">
                Materias por cuatrimestre
              </label>
              <input
                type="number"
                min={1}
                max={10}
                className="w-full bg-surface border border-app rounded-lg px-3 py-2 text-app focus:ring-2 focus:ring-primary outline-none transition-all"
                value={targetLoad}
                onChange={(e) => setTargetLoad(Number(e.target.value) || 1)}
              />
            </div>

            <div className="bg-surface p-4 rounded-xl border border-app">
              <p className="text-sm text-muted mb-1">Tiempo estimado</p>
              <p className="text-2xl font-bold text-app">{projection.semesters} <span className="text-sm font-normal text-muted">cuatrimestres</span></p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-app bg-elevated p-4 shadow-subtle">
          <h3 className="text-lg font-bold text-app mb-3">Desempenio Historico (Promedio)</h3>
          <div style={{ height: CHART_HEIGHTS.line }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.performanceChart.data}>
                <defs>
                  <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.inProgress} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={CHART_COLORS.inProgress} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E3A2E" />
                <XAxis dataKey="label" />
                <YAxis domain={[0, 10]} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1D1A', borderColor: '#2E3A2E' }} />
                <Area type="monotone" dataKey="avgGrade" stroke={CHART_COLORS.inProgress} fillOpacity={1} fill="url(#colorAvg)" name="Promedio" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-app bg-elevated p-4 shadow-subtle">
          <h3 className="text-lg font-bold text-app mb-3">Progreso Acumulado (Burn Up)</h3>
          <div style={{ height: CHART_HEIGHTS.line }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.burnUpChart.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E3A2E" />
                <XAxis dataKey="label" />
                <YAxis domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1D1A', borderColor: '#2E3A2E' }} />
                <Line type="monotone" dataKey="cumulativePercentage" stroke={CHART_COLORS.approved} strokeWidth={3} name="% Completado" dot={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Difficulty Scatter Plot - New Feature */}
      <section className="rounded-2xl border border-app bg-elevated p-4 shadow-subtle">
        <h3 className="text-lg font-bold text-app mb-3">Dificultad vs Nota Real</h3>
        <p className="text-sm text-muted mb-4">Compara la dificultad percibidda con la nota final obtenida.</p>
        <div style={{ height: CHART_HEIGHTS.scatter }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#2E3A2E" />
              <XAxis type="number" dataKey="userPerceivedDifficulty" name="Dificultad" unit="" domain={[0, 10]} />
              <YAxis type="number" dataKey="actualGrade" name="Nota" unit="" domain={[0, 10]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                if (payload && payload.length) {
                  const data = payload[0].payload as any;
                  return (
                    <div className="bg-elevated border border-app p-2 rounded shadow-lg text-xs">
                      <p className="font-bold text-app">{data.subjectName}</p>
                      <p>Dificultad: {data.userPerceivedDifficulty}</p>
                      <p>Nota: {data.actualGrade}</p>
                    </div>
                  );
                }
                return null;
              }} />
              <Scatter name="Materias" data={dashboardData.difficultyScatterChart.data} fill={CHART_COLORS.difficulty} shape="circle" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Legacy Intermediate Section (if needed) */}
      <section className="rounded-2xl border border-app bg-elevated p-4 shadow-subtle">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-app">Titulo Intermedio</h3>
            <p className="text-sm text-muted">Progreso hacia el titulo intermedio.</p>
          </div>
          <button
            className="rounded-lg border border-app bg-surface hover:bg-app-bg px-4 py-2 text-sm font-medium text-app transition-all"
            onClick={() => setShowIntermediateList((prev) => !prev)}
          >
            {showIntermediateList ? 'Ocultar' : 'Ver detalles'}
          </button>
        </div>

        <div className="mt-4">
          <div className="w-full bg-surface rounded-full h-4 overflow-hidden border border-app">
            <div
              className="h-full bg-unlam-500 transition-all duration-1000"
              style={{ width: `${intermediateStats.progress}%` }}
            />
          </div>
          <p className="text-right text-sm text-muted mt-2">{intermediateStats.approved} / {intermediateStats.total} materias</p>
        </div>

        {showIntermediateList && (
          <div className="mt-4 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {intermediateSubjects.map(subject => (
              <div key={subject.id} className="flex justify-between items-center p-2 rounded border border-app bg-surface">
                <span className="text-sm font-medium text-app truncate">{subject.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${subject.status === SubjectStatus.APROBADA ? 'bg-green-900 text-green-200' : 'bg-gray-800 text-gray-400'
                  }`}>
                  {STATUS_LABELS[subject.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
