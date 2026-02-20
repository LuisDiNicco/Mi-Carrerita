interface SideNavProps {
  active: string;
  onChange: (section: string) => void;
}

const items = [
  { id: 'tree', label: 'Árbol de Materias', icon: '🌲' },
  { id: 'schedule', label: 'Planificador', icon: '📅' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'history', label: 'Historia Académica', icon: '📚' },
  { id: 'trophies', label: 'Sala de Trofeos', icon: '🏆' },
];

export const SideNav = ({ active, onChange }: SideNavProps) => {
  return (
    <nav className="flex flex-col gap-3">
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            className={`flex items-start gap-3 text-left px-4 py-3 rounded-lg border transition-all duration-200 shadow-subtle hover:shadow-md ${isActive
                ? 'bg-elevated border-unlam-500 text-app scale-[1.02]'
                : 'bg-surface border-app text-muted hover:text-app hover:border-unlam-500/50 hover:bg-elevated'
              }`}
            onClick={() => onChange(item.id)}
          >
            <span className="text-lg opacity-80 mt-0.5">{item.icon}</span>
            <span className="text-sm font-semibold tracking-wide font-retro leading-tight break-words pt-1">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
