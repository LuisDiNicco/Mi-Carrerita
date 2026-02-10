import { RetroButton } from '../ui/RetroButton';
import { ProgressTrack } from '../ProgressTrack';

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
}

const NAV_ITEMS = [
  { id: 'home', label: 'Inicio' },
  { id: 'tree', label: 'Arbol de materias' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'history', label: 'Historia academica' },
  { id: 'trophies', label: 'Trofeos' },
];

export const AppHeader = ({
  progress,
  stats,
  theme,
  onToggleTheme,
  activeSection,
  onNavigate,
}: AppHeaderProps) => {
  const showStats = activeSection !== 'home';

  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-app bg-surface p-6 shadow-subtle">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted">Portafolio academico</p>
          <h1 className="text-4xl font-bold text-app">Mi Carrerita</h1>
        </div>
        <div className="flex items-center gap-2">
          <RetroButton variant="primary" size="sm" onClick={onToggleTheme}>
            {theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
          </RetroButton>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
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
