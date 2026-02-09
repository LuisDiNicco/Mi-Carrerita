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
}

export const AppHeader = ({ progress, stats, theme, onToggleTheme }: AppHeaderProps) => {
  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-app bg-surface p-6 shadow-subtle">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted">Portafolio academico</p>
          <h1 className="text-4xl font-bold text-app">Mi Carrerita</h1>
        </div>
        <RetroButton variant="primary" size="sm" onClick={onToggleTheme}>
          {theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
        </RetroButton>
      </div>

      <ProgressTrack progress={progress} />

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
    </header>
  );
};
