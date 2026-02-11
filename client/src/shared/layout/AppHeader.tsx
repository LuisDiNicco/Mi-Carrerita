import { useEffect, useRef, useState } from 'react';
import { RetroButton } from '../ui/RetroButton';
import { ProgressTrack } from '../../features/academic/components/ProgressTrack.tsx';

interface AppHeaderProps {
  progress: number;
  stats: {
    total: number;
    approved: number;
    inProgress: number;
    available: number;
  };
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  activeSection: string;
  onNavigate: (section: string) => void;
  userName: string | null;
  onAuthClick: () => void;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { id: 'home', label: 'Inicio' },
  { id: 'tree', label: 'Arbol' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'recommendations', label: 'Recomendaciones' },
  { id: 'history', label: 'Historia' },
  { id: 'trophies', label: 'Trofeos' },
];

export const AppHeader = ({
  progress,
  stats,
  theme,
  onToggleTheme,
  activeSection,
  onNavigate,
  userName,
  onAuthClick,
  onLogout,
}: AppHeaderProps) => {
  const showStats = activeSection === 'tree';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-app bg-surface p-6 shadow-subtle">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted">Portafolio academico</p>
          <h1 className="text-4xl font-bold text-app">Mi Carrerita</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-full border border-app bg-surface px-3 py-2 text-sm text-app"
            onClick={onToggleTheme}
            aria-label="Cambiar tema"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          {userName ? (
            <div className="relative" ref={menuRef}>
              <button
                className="rounded-full border border-app bg-surface px-3 py-2 text-sm text-app"
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                {`Hola, ${userName}`} <span className="ml-1">▾</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-app bg-surface p-3 text-sm shadow-soft">
                  <p className="text-xs uppercase tracking-widest text-muted">Sesion activa</p>
                  <p className="mt-2 text-sm text-app">{userName}</p>
                  <div className="mt-3 grid gap-2">
                    <RetroButton
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setMenuOpen(false);
                        onAuthClick();
                      }}
                    >
                      Cambiar cuenta
                    </RetroButton>
                    <button
                      className="rounded-lg border border-app bg-elevated px-3 py-2 text-sm text-app"
                      onClick={() => {
                        setMenuOpen(false);
                        onLogout();
                      }}
                    >
                      Cerrar sesion
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              className="rounded-full border border-app bg-surface px-3 py-2 text-sm text-app"
              onClick={onAuthClick}
            >
              Iniciar sesion
            </button>
          )}
        </div>
      </div>

      <nav className="flex flex-wrap gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? 'bg-elevated border-accent text-app'
                  : 'bg-surface border-app text-muted hover:text-app'
              }`}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {showStats && <ProgressTrack progress={progress} />}

      {showStats && (
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div className="rounded-lg border border-app bg-elevated px-3 py-2">
            <p className="text-xs text-muted">Total</p>
            <p className="text-lg font-bold text-app">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-app bg-elevated px-3 py-2">
            <p className="text-xs text-muted">Aprobadas</p>
            <p className="text-lg font-bold text-app">{stats.approved}</p>
          </div>
          <div className="rounded-lg border border-app bg-elevated px-3 py-2">
            <p className="text-xs text-muted">En curso</p>
            <p className="text-lg font-bold text-app">{stats.inProgress}</p>
          </div>
          <div className="rounded-lg border border-app bg-elevated px-3 py-2">
            <p className="text-xs text-muted">Disponibles</p>
            <p className="text-lg font-bold text-app">{stats.available}</p>
          </div>
        </div>
      )}
    </header>
  );
};
