interface SideNavProps {
  active: string;
  onChange: (section: string) => void;
}

const items = [
  { id: 'tree', label: 'Arbol de materias' },
  { id: 'dashboard', label: 'Estadisticas' },
  { id: 'history', label: 'Historia academica' },
  { id: 'trophies', label: 'Sala de trofeos' },
];

export const SideNav = ({ active, onChange }: SideNavProps) => {
  return (
    <nav className="flex flex-col gap-2">
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            className={`text-left px-4 py-3 rounded-lg border transition-colors ${
              isActive
                ? 'bg-elevated border-accent text-app'
                : 'bg-surface border-app text-muted hover:text-app'
            }`}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};
