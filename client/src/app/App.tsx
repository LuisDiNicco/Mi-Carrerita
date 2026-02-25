import { useEffect, useMemo, useState } from 'react';
import { CareerGraph } from '../features/academic/components/CareerGraph';
import { BackgroundFX } from '../shared/components/BackgroundFX';
import { AppHeader } from '../shared/layout/AppHeader';
import { useAcademicStore, configureAcademicStore } from '../features/academic/store/academic-store';
import { calculateProgress } from '../shared/lib/utils';
import { SubjectStatus } from '../shared/types/academic';
import { Dashboard } from '../features/dashboard/Dashboard';
import { HistoryTable } from '../features/academic/components/HistoryTable';
import { Landing } from '../features/landing/Landing';
import { TrophiesPanel } from '../features/trophies/TrophiesPanel';
import { RecommendationsPage } from '../features/recommendations/RecommendationsPage';
import { AuthModal } from '../features/auth/components/AuthModal';
import { useAuthStore } from '../features/auth/store/auth-store';
import { clearAccessToken, setAccessToken } from '../features/auth/lib/auth';
import { authFetch } from '../features/auth/lib/api';

// Wire the academic store's auth-awareness at module load time.
// This avoids a circular import (auth-store → academic-store is already
// established; this gives academic-store read-only access to auth state).
configureAcademicStore({
  isGuestGetter: () => useAuthStore.getState().isGuest,
});

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
    // Only count non-optional subjects (62 mandatory: 59 + 3 electivas).
    // Taller de Integración is optional (isOptional:true) and only counts when active.
    const inactiveStatuses: string[] = [SubjectStatus.PENDIENTE, SubjectStatus.DISPONIBLE];
    const countableSubjects = subjects.filter(
      (s) => !s.isOptional || !inactiveStatuses.includes(s.status)
    );
    const total = countableSubjects.length;
    // EQUIVALENCIA counts as approved (same as APROBADA)
    const approved = countableSubjects.filter(
      (s) => s.status === SubjectStatus.APROBADA || s.status === SubjectStatus.EQUIVALENCIA
    ).length;
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
          {activeSection === 'history' && <HistoryTable />}
          {activeSection === 'trophies' && <TrophiesPanel />}
        </main>

        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    </div>
  );
}

export default App;
