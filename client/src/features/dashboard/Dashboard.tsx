import { useMemo, useState } from 'react';
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
import { calculateDashboardData } from './lib/dashboard-logic';
import type { DashboardScope } from './lib/dashboard-logic';

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
  [SubjectStatus.RECURSADA]: 'Recursada',
};

const DEFAULT_LOAD = 4;
const CHART_HEIGHTS = {
  status: 300,
  semester: 300,
  line: 300,
  scatter: 300,
};

export const Dashboard = () => {
  const subjects = useAcademicStore((state) => state.subjects);
  const [scope, setScope] = useState<DashboardScope>('TOTAL');
  const [targetLoad, setTargetLoad] = useState(DEFAULT_LOAD);

  // Calculate data on the fly based on subjects and scope
  const dashboardData = useMemo(() => {
    return calculateDashboardData(subjects, scope);
  }, [subjects, scope]);

  // Projection logic
  const projection = useMemo(() => {
    const { totalSubjects, completedSubjects } = dashboardData.summary;
    const remaining = Math.max(0, totalSubjects - completedSubjects);
    const normalizedLoad = Math.max(1, targetLoad);
    const semesters = Math.ceil(remaining / normalizedLoad);
    return { remaining, semesters };
  }, [dashboardData, targetLoad]);

  const volumeData = useMemo(() => {
    return dashboardData.subjectVolumeChart.data.map(item => ({
      name: STATUS_LABELS[item.status] || item.status,
      value: item.count,
      color: Object.values(SubjectStatus).includes(item.status as SubjectStatus)
        ? CHART_COLORS[item.status === SubjectStatus.APROBADA ? 'approved' :
          item.status === SubjectStatus.REGULARIZADA ? 'regular' :
            item.status === SubjectStatus.EN_CURSO ? 'inProgress' :
              item.status === SubjectStatus.DISPONIBLE ? 'available' :
                item.status === SubjectStatus.RECURSADA ? 'fail' : 'pending']
        : CHART_COLORS.pending
    }));
  }, [dashboardData]);

  if (!subjects.length) return <div className="p-8 text-center text-muted">Cargando datos...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-jersey text-app uppercase">Tablero de Control</h2>
          <p className="text-muted text-sm">Analisis en tiempo real de tu progreso academico.</p>
        </div>

        <div className="flex items-center gap-2 bg-elevated p-1 rounded-lg border border-app">
          <button
            onClick={() => setScope('TOTAL')}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${scope === 'TOTAL'
              ? 'bg-unlam-500 text-app-accent-ink shadow-sm'
              : 'text-muted hover:text-app'
              }`}
          >
            Carrera Completa
          </button>
          <button
            onClick={() => setScope('INTERMEDIATE')}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${scope === 'INTERMEDIATE'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-muted hover:text-app'
              }`}
          >
            Titulo Intermedio
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-app bg-elevated p-4 group hover:border-unlam-500/50 transition-colors">
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Progreso {scope === 'TOTAL' ? 'Total' : 'Intermedio'}</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-app font-mono">{dashboardData.summary.completionPercentage}%</h3>
            <span className="text-xs text-muted text-right">
              {dashboardData.summary.completedSubjects} / {dashboardData.summary.totalSubjects}
              <br />materias
            </span>
          </div>
          <div className="w-full bg-app-bg h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-unlam-500 transition-all duration-1000"
              style={{ width: `${dashboardData.summary.completionPercentage}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-app bg-elevated p-4 hover:border-unlam-500/50 transition-colors">
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Promedio General</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-app font-mono">
              {dashboardData.summary.overallAverageGrade?.toFixed(2) ?? '-'}
            </h3>
            <span className="text-xs text-muted">Nota final</span>
          </div>
        </div>

        <div className="rounded-xl border border-app bg-elevated p-4 hover:border-unlam-500/50 transition-colors">
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Materias Restantes</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-app font-mono">{projection.remaining}</h3>
            <span className="text-xs text-muted">Para finalizar</span>
          </div>
        </div>

        <div className="rounded-xl border border-app bg-elevated p-4 hover:border-unlam-500/50 transition-colors">
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Horas Aprobadas</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-app font-mono">{dashboardData.summary.completedHours}</h3>
            <span className="text-xs text-muted">hs totales</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-app bg-elevated p-5 shadow-subtle flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-app">Distribucion de Estados</h3>
            <p className="text-xs text-muted mt-1">
              Visualiza como se componen tus materias segun su estado actual.
              Ideal para entender que porcentaje de la carrera esta 'activamente' en curso vs pendiente.
            </p>
          </div>
          <div style={{ height: CHART_HEIGHTS.status }} className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={volumeData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={4}
                  stroke="none"
                >
                  {volumeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  iconType="circle"
                  formatter={(value) => <span className="text-app-text text-xs ml-1">{value}</span>}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--app-surface)', borderColor: 'var(--app-border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--app-text)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-app bg-elevated p-5 shadow-subtle flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-app">Proyeccion (Simulador)</h3>
            <p className="text-xs text-muted mt-1">
              Estima cuanto tiempo te falta basado en tu ritmo deseado.
            </p>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-6">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted block font-bold">
                Materias por cuatrimestre
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="1"
                  className="w-full accent-unlam-500 h-2 bg-app-bg rounded-lg appearance-none cursor-pointer"
                  value={targetLoad}
                  onChange={(e) => setTargetLoad(Number(e.target.value))}
                />
                <span className="text-xl font-bold text-unlam-500 font-mono w-8 text-center">{targetLoad}</span>
              </div>
              <p className="text-xs text-muted">
                Ajusta este valor segun cuantas materias planeas cursar.
              </p>
            </div>

            <div className="bg-surface/50 p-5 rounded-xl border border-app text-center">
              <p className="text-sm text-muted mb-1">Finalizarias en aproximadamente</p>
              <p className="text-4xl font-bold text-app font-mono mb-1">{projection.semesters}</p>
              <p className="text-sm font-bold text-unlam-500 uppercase tracking-widest">Cuatrimestres</p>
              <p className="text-[10px] text-muted mt-2">({(projection.semesters / 2).toFixed(1)} anios)</p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-app bg-elevated p-5 shadow-subtle">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-app">Evolucion del Promedio</h3>
            <p className="text-xs text-muted mt-1">
              Analiza la tendencia de tu promedio academico a lo largo del tiempo.
              Los puntos representan el promedio acumulado al finalizar cada periodo.
            </p>
          </div>
          <div style={{ height: CHART_HEIGHTS.line }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.performanceChart.data}>
                <defs>
                  <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.inProgress} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CHART_COLORS.inProgress} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="var(--app-muted)"
                  tick={{ fontSize: 10 }}
                  tickMargin={10}
                />
                <YAxis
                  domain={[0, 10]}
                  stroke="var(--app-muted)"
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--app-surface)', borderColor: 'var(--app-border)', borderRadius: '8px' }}
                />
                <Area
                  type="monotone"
                  dataKey="avgGrade"
                  stroke={CHART_COLORS.inProgress}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAvg)"
                  name="Promedio"
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-app bg-elevated p-5 shadow-subtle">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-app">Progreso Acumulado (Burn Up)</h3>
            <p className="text-xs text-muted mt-1">
              Velocidad de avance en la carrera. La pendiente de la curva indica tu ritmo de aprobacion de materias.
            </p>
          </div>
          <div style={{ height: CHART_HEIGHTS.line }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.burnUpChart.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="var(--app-muted)"
                  tick={{ fontSize: 10 }}
                  tickMargin={10}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="var(--app-muted)"
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--app-surface)', borderColor: 'var(--app-border)', borderRadius: '8px' }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativePercentage"
                  stroke={CHART_COLORS.approved}
                  strokeWidth={3}
                  name="% Completado"
                  dot={{ r: 4, fill: CHART_COLORS.approved, strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Difficulty Scatter Plot */}
      <section className="rounded-2xl border border-app bg-elevated p-5 shadow-subtle">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-app">Dificultad vs Nota Real</h3>
          <p className="text-xs text-muted mt-1">
            Correlacion entre la dificultad percibida de la materia y tu nota final.
            Puntos arriba a la izquierda: Materias faciles con buena nota.
            Puntos abajo a la derecha: Materias dificiles con baja nota.
          </p>
        </div>
        <div style={{ height: CHART_HEIGHTS.scatter }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" />
              <XAxis
                type="number"
                dataKey="userPerceivedDifficulty"
                name="Dificultad"
                unit=""
                domain={[0, 100]}
                stroke="var(--app-muted)"
                label={{ value: 'Dificultad (0-100)', position: 'bottom', offset: 0, fill: 'var(--app-muted)', fontSize: 12 }}
              />
              <YAxis
                type="number"
                dataKey="actualGrade"
                name="Nota"
                unit=""
                domain={[0, 10]}
                stroke="var(--app-muted)"
                label={{ value: 'Nota Final', angle: -90, position: 'left', offset: 0, fill: 'var(--app-muted)', fontSize: 12 }}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  if (payload && payload.length) {
                    const data = payload[0].payload as any;
                    return (
                      <div className="bg-surface border border-app p-3 rounded-lg shadow-lg text-xs z-50">
                        <p className="font-bold text-app mb-1 text-sm">{data.subjectName}</p>
                        <div className="space-y-1 text-muted">
                          <p>Dificultad: <span className="text-app">{data.userPerceivedDifficulty}</span></p>
                          <p>Nota: <span className="text-app">{data.actualGrade}</span></p>
                          <p>Año: <span className="text-app">{data.year}</span></p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Materias" data={dashboardData.difficultyScatterChart.data} fill={CHART_COLORS.difficulty} shape="circle" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};
