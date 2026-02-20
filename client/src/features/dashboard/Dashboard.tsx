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
    <div className="space-y-12 animate-in fade-in duration-500 pb-16">

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-jersey text-app uppercase">Dashboard</h2>
          <p className="text-muted text-sm">Análisis en tiempo real de tu progreso académico.</p>
        </div>

        <div className="flex items-center gap-2 bg-elevated p-1 rounded-lg border border-app shadow-subtle">
          <button
            onClick={() => setScope('TOTAL')}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${scope === 'TOTAL'
              ? 'bg-unlam-500 text-app-accent-ink shadow-sm scale-105'
              : 'text-muted hover:text-app'
              }`}
          >
            Carrera Completa
          </button>
          <button
            onClick={() => setScope('INTERMEDIATE')}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${scope === 'INTERMEDIATE'
              ? 'bg-blue-500 text-white shadow-sm scale-105'
              : 'text-muted hover:text-app'
              }`}
          >
            Título Intermedio
          </button>
        </div>
      </div>

      {/* SUBSECTION: Resumen General */}
      <section className="space-y-4">
        <div className="border-b-2 border-app-border/50 pb-2">
          <h3 className="text-xl font-jersey tracking-wide text-app uppercase flex items-center gap-2">
            <span className="text-unlam-500">#</span> Resumen General
          </h3>
          <p className="text-sm text-muted">Métricas clave sobre el estado actual de la cursada.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-app bg-elevated p-4 group hover:border-unlam-500/50 transition-colors shadow-subtle hover:shadow-md">
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

          <div className="rounded-xl border border-app bg-elevated p-4 hover:border-unlam-500/50 transition-colors shadow-subtle hover:shadow-md">
            <p className="text-xs text-muted uppercase tracking-wider mb-1">Promedio General</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-app font-mono">
                {dashboardData.summary.overallAverageGrade?.toFixed(2) ?? '-'}
              </h3>
              <span className="text-xs text-muted">Nota final</span>
            </div>
          </div>

          <div className="rounded-xl border border-app bg-elevated p-4 hover:border-unlam-500/50 transition-colors shadow-subtle hover:shadow-md">
            <p className="text-xs text-muted uppercase tracking-wider mb-1">Materias Restantes</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-app font-mono">{projection.remaining}</h3>
              <span className="text-xs text-muted">Para finalizar</span>
            </div>
          </div>

          <div className="rounded-xl border border-app bg-elevated p-4 hover:border-unlam-500/50 transition-colors shadow-subtle hover:shadow-md">
            <p className="text-xs text-muted uppercase tracking-wider mb-1">Horas Aprobadas</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-app font-mono">{dashboardData.summary.completedHours}</h3>
              <span className="text-xs text-muted">hs totales</span>
            </div>
          </div>
        </div>
      </section>

      {/* SUBSECTION: Análisis de Progreso */}
      <section className="space-y-4">
        <div className="border-b-2 border-app-border/50 pb-2 flex justify-between items-end">
          <div>
            <h3 className="text-xl font-jersey tracking-wide text-app uppercase flex items-center gap-2">
              <span className="text-unlam-500">#</span> Análisis de Progreso
            </h3>
            <p className="text-sm text-muted">Mide tu velocidad de avance académico y carga por año del plan.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Burn Up Chart */}
          <div className="rounded-2xl border border-app bg-elevated p-5 shadow-subtle hover:shadow-md transition-shadow">
            <h4 className="text-lg font-bold text-app mb-1">Progreso Acumulado (Burn Up)</h4>
            <p className="text-xs text-muted mb-6 h-8">
              La curva creciente muestra cómo suma tu % de título completado. A mayor pendiente, mejor ritmo.
            </p>
            <div style={{ height: CHART_HEIGHTS.line }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData.burnUpChart.data} margin={{ top: 5, right: 20, bottom: 25, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="var(--app-muted)"
                    tick={{ fontSize: 10 }}
                    tickMargin={10}
                    label={{ value: 'Período (Año-Cuatrimestre)', position: 'insideBottom', offset: -15, fill: 'var(--app-muted)', fontSize: 11 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="var(--app-muted)"
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Porcentaje Completado (%)', angle: -90, position: 'insideLeft', offset: 0, fill: 'var(--app-muted)', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--app-surface)', borderColor: 'var(--app-border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--app-text)' }}
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
          </div>

          {/* Progress By Year Chart */}
          <div className="rounded-2xl border border-app bg-elevated p-5 shadow-subtle hover:shadow-md transition-shadow">
            <h4 className="text-lg font-bold text-app mb-1">Avance por Año del Plan</h4>
            <p className="text-xs text-muted mb-6 h-8">
              Muestra cuántas materias aprobadas tenés sobre el total de materias que conforman cada año del plan.
            </p>
            <div style={{ height: CHART_HEIGHTS.line }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData.progressByYearChart.data} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                  <defs>
                    <linearGradient id="colorYear" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.inProgress} stopOpacity={0.5} />
                      <stop offset="95%" stopColor={CHART_COLORS.inProgress} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
                  <XAxis
                    dataKey="year"
                    stroke="var(--app-muted)"
                    tick={{ fontSize: 10 }}
                    tickMargin={10}
                    label={{ value: 'Año del Plan de Estudios', position: 'insideBottom', offset: -15, fill: 'var(--app-muted)', fontSize: 11 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="var(--app-muted)"
                    tick={{ fontSize: 10 }}
                    label={{ value: '% Materias Aprobadas', angle: -90, position: 'insideLeft', offset: 15, fill: 'var(--app-muted)', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--app-surface)', borderColor: 'var(--app-border)', borderRadius: '8px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="percentage"
                    stroke={CHART_COLORS.inProgress}
                    fillOpacity={1}
                    fill="url(#colorYear)"
                    name="% Completado del Año"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* SUBSECTION: Rendimiento Académico */}
      <section className="space-y-4">
        <div className="border-b-2 border-app-border/50 pb-2">
          <h3 className="text-xl font-jersey tracking-wide text-app uppercase flex items-center gap-2">
            <span className="text-unlam-500">#</span> Rendimiento Académico
          </h3>
          <p className="text-sm text-muted">Evalúa cómo rinden tus notas según tiempo y dificultad.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Promedio Chart */}
          <div className="rounded-2xl border border-app bg-elevated p-5 shadow-subtle hover:shadow-md transition-shadow">
            <h4 className="text-lg font-bold text-app mb-1">Evolución del Promedio</h4>
            <p className="text-xs text-muted mb-6 h-8">
              Tendencia de tu nota promedio acumulada a lo largo de los cuatrimestres rendidos.
            </p>
            <div style={{ height: CHART_HEIGHTS.line }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData.performanceChart.data} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="var(--app-muted)"
                    tick={{ fontSize: 10 }}
                    tickMargin={10}
                    label={{ value: 'Período', position: 'insideBottom', offset: -15, fill: 'var(--app-muted)', fontSize: 11 }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    stroke="var(--app-muted)"
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Nota Promedio Acumulada', angle: -90, position: 'insideLeft', offset: 15, fill: 'var(--app-muted)', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--app-surface)', borderColor: 'var(--app-border)', borderRadius: '8px' }}
                  />
                  <Line
                    type="stepAfter"
                    dataKey="avgGrade"
                    stroke={CHART_COLORS.regular}
                    strokeWidth={3}
                    name="Promedio"
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Difficulty Scatter */}
          <div className="rounded-2xl border border-app bg-elevated p-5 shadow-subtle hover:shadow-md transition-shadow">
            <h4 className="text-lg font-bold text-app mb-1">Dificultad vs Nota Real</h4>
            <p className="text-xs text-muted mb-6 h-8">
              Comprueba si a mayor dificultad subjetiva, menor la nota. Puntos en la esquina superior izquierda son victorias fáciles.
            </p>
            <div style={{ height: CHART_HEIGHTS.scatter }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" />
                  <XAxis
                    type="number"
                    dataKey="userPerceivedDifficulty"
                    name="Dificultad"
                    unit=""
                    domain={[0, 100]}
                    stroke="var(--app-muted)"
                    label={{ value: 'Dificultad Percibida (0-100)', position: 'bottom', offset: -5, fill: 'var(--app-muted)', fontSize: 11 }}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="actualGrade"
                    name="Nota"
                    unit=""
                    domain={[0, 10]}
                    stroke="var(--app-muted)"
                    label={{ value: 'Nota Final Obtenida (1-10)', angle: -90, position: 'insideLeft', offset: 15, fill: 'var(--app-muted)', fontSize: 11 }}
                    tick={{ fontSize: 10 }}
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
          </div>
        </div>
      </section>

      {/* SUBSECTION: Distribución y Estimaciones */}
      <section className="space-y-4">
        <div className="border-b-2 border-app-border/50 pb-2">
          <h3 className="text-xl font-jersey tracking-wide text-app uppercase flex items-center gap-2">
            <span className="text-unlam-500">#</span> Distribución y Estimaciones
          </h3>
          <p className="text-sm text-muted">Averigua de un pantallazo tu status actual y previsiones de finalización.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-app bg-elevated p-5 shadow-subtle hover:shadow-md transition-shadow flex flex-col">
            <div className="mb-4">
              <h4 className="text-lg font-bold text-app">Distribución de Estados</h4>
              <p className="text-xs text-muted mb-2">
                Cuántas materias pertenecen a cada estado. Ayuda a ver visualmente cuánto falta cursar (Pendientes) vs terminado.
              </p>
            </div>
            <div style={{ height: CHART_HEIGHTS.status }} className="flex-1 w-full">
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
                    formatter={(value) => <span className="text-app-text text-xs ml-1 font-bold">{value}</span>}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--app-surface)', borderColor: 'var(--app-border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--app-text)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-app bg-elevated p-5 shadow-subtle hover:shadow-md transition-shadow flex flex-col">
            <div className="mb-4">
              <h4 className="text-lg font-bold text-app">Proyección (Simulador)</h4>
              <p className="text-xs text-muted mb-2">
                Calcula la cantidad de cuatrimestres necesarios basados en tu ritmo.
              </p>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider text-muted block font-bold">
                  Cant. de materias a anotar por cuatrimestre:
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
                  <span className="text-xl font-bold text-unlam-500 font-mono w-8 text-center bg-surface border border-app rounded-md py-1">{targetLoad}</span>
                </div>
              </div>

              <div className="bg-surface/50 p-6 rounded-xl border border-app text-center shadow-inner">
                <p className="text-sm text-muted mb-1 font-bold">Restarían aproximadamente</p>
                <p className="text-5xl font-bold text-app font-jersey text-shadow mt-2 mb-2 tracking-wide">{projection.semesters}</p>
                <p className="text-sm font-bold text-unlam-500 uppercase tracking-widest mt-1">Cuatrimestres</p>
                <p className="text-xs text-muted mt-2 block font-mono">({(projection.semesters / 2).toFixed(1)} años de cursada regular)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
