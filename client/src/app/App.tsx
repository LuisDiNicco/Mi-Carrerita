import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { CareerGraph } from '../features/academic/components/CareerGraph';
import { BackgroundFX } from '../shared/components/BackgroundFX';
import { AppHeader } from '../shared/layout/AppHeader';
import { useAcademicStore, configureAcademicStore } from '../features/academic/store/academic-store';
import { calculateProgress } from '../shared/lib/utils';
import { SubjectStatus } from '../shared/types/academic';
import { AuthModal } from '../features/auth/components/AuthModal';
import { useAuthStore } from '../features/auth/store/auth-store';
import { PageSkeleton } from '../shared/ui/Skeleton';
import { Landing } from '../features/landing/Landing';

const Dashboard = React.lazy(() => import('../features/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const HistoryTable = React.lazy(() => import('../features/academic/components/HistoryTable').then(m => ({ default: m.HistoryTable })));
const TrophiesPanel = React.lazy(() => import('../features/trophies/TrophiesPanel').then(m => ({ default: m.TrophiesPanel })));
const RecommendationsPage = React.lazy(() => import('../features/recommendations/RecommendationsPage').then(m => ({ default: m.RecommendationsPage })));
import { clearAccessToken, setAccessToken, getAccessToken } from '../features/auth/lib/auth';
import { authFetch } from '../features/auth/lib/api';

// Wire the academic store's auth-awareness at module load time.
configureAcademicStore({
  isGuestGetter: () => useAuthStore.getState().isGuest,
});

// ─── Captura síncrona del access_token del OAuth redirect ────────────────────
// Corre a nivel de módulo, ANTES de que React renderice nada.
// Esto evita la race condition donde hydrateAuth() restaura isGuest=false
// y los componentes hacen fetch con accessToken=null en memoria.
{
  const _params = new URLSearchParams(window.location.search);
  const _oauthToken = _params.get('access_token');
  if (_oauthToken) {
    setAccessToken(_oauthToken);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [authOpen, setAuthOpen] = useState(false);
  const subjects = useAcademicStore((state) => state.subjects);
  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const hydrateAuth = useAuthStore((state) => state.hydrate);
  const isWakingUp = useAuthStore((state) => state.isWakingUp);
  const setWakingUp = useAuthStore((state) => state.setWakingUp);

  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      try {
        const appApiUrl = import.meta.env.VITE_API_URL || '/api';
        const res = await fetch(`${appApiUrl}/health`);
        // If Vercel returns 504 because Render isn't awake yet
        if (!res.ok && res.status >= 500) {
          if (mounted) setWakingUp(true);
          const interval = setInterval(async () => {
            try {
              const check = await fetch(`${appApiUrl}/health`);
              if (check.ok) {
                setWakingUp(false);
                clearInterval(interval);
              }
            } catch { }
          }, 5000);
        }
      } catch {
        // Fetch throwing an error means CORS timeout or network error
        if (mounted) setWakingUp(true);
      }
    };
    checkHealth();
    return () => { mounted = false; };
  }, [setWakingUp]);

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

  // Si llegamos de un redirect de Google OAuth (access_token capturado arriba),
  // completar el login llamando a /auth/me para identificar al usuario.
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    if (useAuthStore.getState().user) return; // Ya hay usuario: login previo

    const appApiUrl = import.meta.env.VITE_API_URL || "/api";
    authFetch(`${appApiUrl}/auth/me`)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const inactiveStatuses: string[] = [SubjectStatus.PENDIENTE, SubjectStatus.DISPONIBLE];
    const countableSubjects = subjects.filter(
      (s) => !s.isOptional || !inactiveStatuses.includes(s.status)
    );
    const total = countableSubjects.length;
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
      const appApiUrl = import.meta.env.VITE_API_URL || "/api";
      await fetch(`${appApiUrl}/auth/logout`, {
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
          <Suspense fallback={<PageSkeleton />}>
            {activeSection === 'dashboard' && <Dashboard />}
            {activeSection === 'recommendations' && <RecommendationsPage />}
            {activeSection === 'history' && <HistoryTable />}
            {activeSection === 'trophies' && <TrophiesPanel />}
          </Suspense>
        </main>

        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

        {isWakingUp && (
          <div className="fixed bottom-6 right-6 z-50 animate-bounce">
            <div className="bg-surface text-app border-2 border-unlam-500 rounded-lg p-4 shadow-[4px_4px_0px_0px_rgba(16,185,129,0.3)]">
              <div className="flex items-center space-x-3">
                <div className="relative w-6 h-6 flex-shrink-0">
                  <div className="absolute inset-0 border-2 border-unlam-500 border-t-transparent animate-spin rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-retro text-sm text-unlam-500">SERVER OFFLINE</h3>
                  <p className="text-xs mt-1 text-muted font-medium">Bostezando... despertando (puede demorar ~1 min)</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
