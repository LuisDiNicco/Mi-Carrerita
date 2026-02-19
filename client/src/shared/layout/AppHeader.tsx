import { useEffect, useRef, useState } from 'react';

interface AppHeaderProps {
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
  { id: 'tree', label: 'Árbol' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'recommendations', label: 'Recomendaciones' },
  { id: 'history', label: 'Historia' },
  { id: 'schedule', label: 'Horarios' },
  { id: 'trophies', label: 'Trofeos' },
];

export const AppHeader = ({
  theme,
  onToggleTheme,
  activeSection,
  onNavigate,
  userName,
  onAuthClick,
  onLogout,
}: AppHeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    <header className="sticky top-0 z-50 border-b-2 border-app-border bg-app-bg shadow-lg" style={{ backgroundColor: 'var(--app-bg)' }}>
      <div className="mx-auto max-w-7xl">
        {/* Desktop Header - Single Line */}
        <div className="hidden items-center justify-between px-6 py-4 lg:flex">
          {/* Logo - Left */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 transition-transform hover:scale-105"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-app-border bg-unlam-500 text-xl font-bold text-black">
              🎓
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold leading-none text-app">Mi Carrerita</h1>
              <p className="text-xs uppercase tracking-wider text-muted">UNLAM Informática</p>
            </div>
          </button>

          {/* Navigation - Center */}
          <nav className="flex items-center gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${isActive
                      ? 'border-unlam-500 bg-unlam-500 text-black shadow-retro'
                      : 'border-app-border bg-app-bg text-app hover:border-unlam-500 hover:text-unlam-500'
                    }`}
                  onClick={() => onNavigate(item.id)}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User + Theme - Right */}
          <div className="flex items-center gap-3">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-app-border bg-app-bg text-app transition-all hover:border-unlam-500 hover:text-unlam-500"
              onClick={onToggleTheme}
              aria-label="Cambiar tema"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            {userName ? (
              <div className="relative" ref={menuRef}>
                <button
                  className="flex items-center gap-2 rounded-lg border-2 border-app-border bg-app-bg px-4 py-2 text-sm font-medium text-app transition-all hover:border-unlam-500"
                  onClick={() => setMenuOpen((prev) => !prev)}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-unlam-500 text-xs font-bold text-black">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                  {userName}
                  <span className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`}>▾</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-lg border-2 border-app-border bg-app-bg p-4 shadow-retro">
                    <p className="text-xs uppercase tracking-wider text-muted">Sesión activa</p>
                    <p className="mt-2 text-sm font-medium text-app">{userName}</p>
                    <div className="mt-4 space-y-2">
                      <button
                        className="w-full rounded-lg border-2 border-unlam-500 bg-unlam-500 px-4 py-2 text-sm font-medium text-black transition-all hover:scale-105"
                        onClick={() => {
                          setMenuOpen(false);
                          onAuthClick();
                        }}
                      >
                        Cambiar cuenta
                      </button>
                      <button
                        className="w-full rounded-lg border-2 border-app-border bg-app-bg px-4 py-2 text-sm font-medium text-app transition-all hover:border-red-500 hover:text-red-500"
                        onClick={() => {
                          setMenuOpen(false);
                          onLogout();
                        }}
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="rounded-lg border-2 border-unlam-500 bg-unlam-500 px-4 py-2 text-sm font-medium text-black transition-all hover:scale-105"
                onClick={onAuthClick}
              >
                Iniciar sesión
              </button>
            )}
          </div>
        </div>

        {/* Mobile Header */}
        <div className="flex items-center justify-between px-4 py-3 lg:hidden">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-app-border bg-unlam-500 text-lg font-bold text-black">
              🎓
            </div>
            <span className="text-lg font-bold text-app">Mi Carrerita</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-app-border bg-app-bg text-app"
              onClick={onToggleTheme}
              aria-label="Cambiar tema"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-app-border bg-app-bg text-app"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t-2 border-app-border bg-app-bg px-4 py-4 lg:hidden">
            <nav className="space-y-2">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    className={`w-full rounded-lg border-2 px-4 py-2 text-left text-sm font-medium transition-all ${isActive
                        ? 'border-unlam-500 bg-unlam-500 text-black'
                        : 'border-app-border bg-app-bg text-app hover:border-unlam-500'
                      }`}
                    onClick={() => {
                      onNavigate(item.id);
                      setMobileMenuOpen(false);
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-4 border-t-2 border-app-border pt-4">
              {userName ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-muted">Usuario</p>
                  <p className="text-sm font-medium text-app">{userName}</p>
                  <button
                    className="w-full rounded-lg border-2 border-unlam-500 bg-unlam-500 px-4 py-2 text-sm font-medium text-black"
                    onClick={() => {
                      onAuthClick();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Cambiar cuenta
                  </button>
                  <button
                    className="w-full rounded-lg border-2 border-app-border bg-app-bg px-4 py-2 text-sm font-medium text-app"
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <button
                  className="w-full rounded-lg border-2 border-unlam-500 bg-unlam-500 px-4 py-2 text-sm font-medium text-black"
                  onClick={() => {
                    onAuthClick();
                    setMobileMenuOpen(false);
                  }}
                >
                  Iniciar sesión
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
