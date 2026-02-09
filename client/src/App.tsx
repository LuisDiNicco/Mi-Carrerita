import { useEffect, useMemo, useState } from 'react';
import { CareerGraph } from './components/CareerGraph';
import { BackgroundFX } from './components/BackgroundFX';
import { AppHeader } from './components/layout/AppHeader';
import { SideNav } from './components/layout/SideNav';
import { useAcademicStore } from './store/academic-store';
import { calculateProgress } from './lib/utils';
import { SubjectStatus } from './types/academic';
import { Dashboard } from './components/Dashboard';
import { HistoryTable } from './components/HistoryTable';

function App() {
  const [activeSection, setActiveSection] = useState('tree');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const subjects = useAcademicStore((state) => state.subjects);

  useEffect(() => {
    const storedTheme = localStorage.getItem('mi-carrerita-theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme);
      document.documentElement.setAttribute('data-theme', storedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mi-carrerita-theme', theme);
  }, [theme]);

  const stats = useMemo(() => {
    const total = subjects.length;
    const approved = subjects.filter((s) => s.status === SubjectStatus.APROBADA).length;
    const inProgress = subjects.filter((s) => s.status === SubjectStatus.EN_CURSO).length;
    const available = subjects.filter((s) => s.status === SubjectStatus.DISPONIBLE).length;
    return { total, approved, inProgress, available };
  }, [subjects]);

  const progress = useMemo(
    () => calculateProgress(stats.total, stats.approved),
    [stats.total, stats.approved]
  );

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="relative min-h-screen bg-app text-app">
      <BackgroundFX />
      <div className="relative z-10 flex min-h-screen flex-col gap-6 p-6">
        <AppHeader
          progress={progress}
          stats={stats}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-2xl border border-app bg-surface p-4 shadow-subtle">
            <p className="text-xs uppercase tracking-widest text-muted mb-3">Menu</p>
            <SideNav active={activeSection} onChange={setActiveSection} />
          </aside>

          <main className="rounded-2xl border border-app bg-surface p-4 shadow-subtle">
            {activeSection === 'tree' && <CareerGraph />}
            {activeSection === 'dashboard' && <Dashboard />}
            {activeSection === 'history' && <HistoryTable />}
            {activeSection === 'trophies' && (
              <SectionPlaceholder
                title="Sala de trofeos"
                description="Logros y hitos desbloqueados (mock)."
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;

const SectionPlaceholder = ({ title, description }: { title: string; description: string }) => {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-2xl font-bold text-app">{title}</h2>
      <p className="text-muted max-w-md">{description}</p>
    </div>
  );
};