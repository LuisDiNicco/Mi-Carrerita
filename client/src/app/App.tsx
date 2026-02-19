import { useEffect, useMemo, useState } from 'react';
import { CareerGraph } from '../features/academic/components/CareerGraph';
import { BackgroundFX } from '../shared/components/BackgroundFX';
import { AppHeader } from '../shared/layout/AppHeader';
import { useAcademicStore } from '../features/academic/store/academic-store';
import { calculateProgress } from '../shared/lib/utils';
import { SubjectStatus } from '../shared/types/academic';
import { Dashboard } from '../features/dashboard/Dashboard';
import { HistoryTable } from '../features/academic/components/HistoryTable';
import { Landing } from '../features/landing/Landing';
import { TrophiesPanel } from '../features/trophies/TrophiesPanel';
import { RecommendationsPage } from '../features/recommendations/RecommendationsPage';
import { SchedulePage } from '../features/schedule/SchedulePage';
import { AuthModal } from '../features/auth/components/AuthModal';
import { useAuthStore } from '../features/auth/store/auth-store';
import { clearAccessToken, setAccessToken } from '../features/auth/lib/auth';
import { authFetch } from '../features/auth/lib/api';

function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [authOpen, setAuthOpen] = useState(false);
  const subjects = useAcademicStore((state) => state.subjects);
  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const hydrateAuth = useAuthStore((state) => state.hydrate);

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

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');

    if (!accessToken) return;

    setAccessToken(accessToken);
    window.history.replaceState({}, document.title, window.location.pathname);

    authFetch(`${import.meta.env.VITE_API_URL}/auth/me`)
      .then((response) => (response.ok ? response.json() : null))
      .then((user) => {
        if (user?.email) {
          useAuthStore.getState().login({
            name: user.name ?? 'Usuario',
            email: user.email,
          });
        }
      })
      .catch(() => null);
  }, []);

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

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      clearAccessToken();
      logout();
      setAuthOpen(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-app text-app">
      <BackgroundFX />
      <div className="relative z-10 flex min-h-screen flex-col">
        <AppHeader
          theme={theme}
          onToggleTheme={handleToggleTheme}
          activeSection={activeSection}
          onNavigate={setActiveSection}
          userName={authUser?.name ?? null}
          onAuthClick={() => setAuthOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-6">
          {activeSection === 'home' && (
            <Landing onStart={() => setActiveSection('tree')} />
          )}
          {activeSection === 'tree' && (
            <div className="space-y-6">
              <CareerGraph progress={progress} stats={stats} />
            </div>
          )}
          {activeSection === 'dashboard' && <Dashboard />}
          {activeSection === 'recommendations' && <RecommendationsPage />}
          {activeSection === 'schedule' && <SchedulePage />}
          {activeSection === 'history' && <HistoryTable />}
          {activeSection === 'trophies' && <TrophiesPanel />}
        </main>

        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    </div>
  );
}

export default App;
