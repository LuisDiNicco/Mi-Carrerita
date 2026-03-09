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
import { clearAccessToken, getAccessToken, setAccessToken } from '../features/auth/lib/auth';
import { authFetch } from '../features/auth/lib/api';

const Dashboard = React.lazy(() => import('../features/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const HistoryTable = React.lazy(() => import('../features/academic/components/HistoryTable').then(m => ({ default: m.HistoryTable })));
const TrophiesPanel = React.lazy(() => import('../features/trophies/TrophiesPanel').then(m => ({ default: m.TrophiesPanel })));
const RecommendationsPage = React.lazy(() => import('../features/recommendations/RecommendationsPage').then(m => ({ default: m.RecommendationsPage })));

// Wire the academic store's auth-awareness at module load time.
configureAcademicStore({
  isGuestGetter: () => useAuthStore.getState().isGuest,
});

// ─── Captura síncrona del access_token del OAuth redirect ────────────────────
// Corre a nivel de módulo, ANTES de que React renderice nada.
{
  const _params = new URLSearchParams(window.location.search);
  const _oauthToken = _params.get('access_token');
  if (_oauthToken) {
    setAccessToken(_oauthToken);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

function WakingUpBanner() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-surface text-app border-2 border-unlam-500 rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(16,185,129,0.25)] flex items-center gap-3 min-w-[260px]">
        {/* Spinner */}
        <div className="relative w-6 h-6 flex-shrink-0">
          <div className="absolute inset-0 border-2 border-unlam-500 border-t-transparent animate-spin rounded-full" />
        </div>
        <div>
          <p className="font-retro text-sm text-unlam-500 leading-tight">Servidor despertando&hellip;</p>
          <p className="text-[11px] text-muted mt-0.5">Puede demorar ~1 minuto en la primera visita</p>
        </div>
      </div>
    </div>
  );
}

/** Shown while authReady=false — a subtle centered spinner, not a section-level error */
function AuthInitializing() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 py-32 animate-in fade-in duration-300">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 border-2 border-unlam-500 border-t-transparent animate-spin rounded-full" />
      </div>
      <p className="text-muted text-sm">Verificando sesión&hellip;</p>
    </div>
  );
}

function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [authOpen, setAuthOpen] = useState(false);
  const subjects = useAcademicStore((state) => state.subjects);
  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const initAuth = useAuthStore((state) => state.initAuth);
  const authReady = useAuthStore((state) => state.authReady);
  const isWakingUp = useAuthStore((state) => state.isWakingUp);
  const setWakingUp = useAuthStore((state) => state.setWakingUp);

  // ── 1. Initialise auth ONCE (try silent token refresh) ──────────────────────
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // ── 2. Server health check (Render cold-start) ──────────────────────────────
  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      try {
        const appApiUrl = import.meta.env.VITE_API_URL || '/api';
        const res = await fetch(`${appApiUrl}/health`);
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
        if (mounted) setWakingUp(true);
        // Keep polling until healthy
        const appApiUrl = import.meta.env.VITE_API_URL || '/api';
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
    };
    checkHealth();
    return () => { mounted = false; };
  }, [setWakingUp]);

  // ── 3. Theme ─────────────────────────────────────────────────────────────────
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

  // ── 4. Google OAuth redirect token ──────────────────────────────────────────
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    if (useAuthStore.getState().user) return;

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

  // ── Stats ────────────────────────────────────────────────────────────────────
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

  // Sections that require authReady before mounting
  const needsAuth = activeSection !== 'home' && activeSection !== 'tree';
  const showAuthGate = needsAuth && !authReady;

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

          {/* Auth gate: show spinner while initAuth is pending */}
          {showAuthGate && <AuthInitializing />}

          {!showAuthGate && (
            <Suspense fallback={<PageSkeleton />}>
              {activeSection === 'dashboard' && <Dashboard />}
              {activeSection === 'recommendations' && <RecommendationsPage />}
              {activeSection === 'history' && <HistoryTable />}
              {activeSection === 'trophies' && <TrophiesPanel />}
            </Suspense>
          )}
        </main>

        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

        {/* Server waking up — subtle floating banner */}
        {isWakingUp && <WakingUpBanner />}
      </div>
    </div>
  );
}

export default App;
