import { RetroButton } from '../../shared/ui/RetroButton';

interface LandingProps {
  onStart: () => void;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: '🌳',
    title: 'Árbol Interactivo',
    description: 'Visualiza materias, correlatividades y tu progreso en tiempo real',
  },
  {
    icon: '📊',
    title: 'Dashboard Completo',
    description: 'Estadísticas, gráficos y proyección de finalización de carrera',
  },
  {
    icon: '🎯',
    title: 'Recomendaciones',
    description: 'Planes optimizados basados en algoritmos de ruta crítica',
  },
  {
    icon: '🏆',
    title: 'Sistema de Logros',
    description: 'Desbloquea trofeos y milestones mientras avanzas',
  },
];

export const Landing = ({ onStart }: LandingProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-20 pb-20 px-4 sm:px-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-unlam-500/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-unlam-500/5 rounded-full blur-3xl -z-10" />
      
      {/* Hero Section */}
      <div className="text-center space-y-8 max-w-6xl w-full">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface border-2 border-unlam-500/30 rounded-full shadow-subtle hover:border-unlam-500 transition-colors">
          <span className="h-2 w-2 rounded-full bg-unlam-500" />
          <span className="font-retro text-xs text-app uppercase tracking-widest">
            🎓 Ingeniería en Informática - UNLAM
          </span>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-unlam-500/10 via-transparent to-unlam-500/10 rounded-3xl blur-2xl" />
          <div className="relative rounded-3xl border-2 border-unlam-500/40 bg-gradient-to-br from-app-bg to-app-elevated p-12 sm:p-16 shadow-lg backdrop-blur-sm">
            <h1 className="font-retro text-5xl sm:text-6xl lg:text-7xl text-unlam-500 drop-shadow-lg leading-tight">
              MI CARRERITA
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-app max-w-2xl mx-auto leading-relaxed font-mono font-medium">
              La plataforma inteligente para <span className="text-unlam-500 font-bold">rastrear, optimizar y dominar</span> tu carrera académica con visualización en tiempo real y recomendaciones basadas en datos.
            </p>

            {/* Stats Grid - Inline */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
              {[
                { value: '63', label: 'Materias', icon: '📚' },
                { value: '5', label: 'Años', icon: '📅' },
                { value: '100%', label: 'Gratis', icon: '✨' },
                { value: '∞', label: 'Updates', icon: '🔄' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-unlam-500/30 bg-surface/50 px-3 sm:px-4 py-3 sm:py-4 hover:border-unlam-500 transition-all hover:shadow-md">
                  <div className="text-2xl sm:text-3xl mb-1">{stat.icon}</div>
                  <div className="font-mono font-bold text-3xl sm:text-4xl text-unlam-500 tracking-tight">{stat.value}</div>
                  <div className="text-xs text-muted uppercase tracking-widest font-semibold">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <RetroButton variant="primary" size="lg" onClick={onStart} className="w-full sm:w-auto">
                🚀 Comenzar Ahora
              </RetroButton>
              <button
                className="w-full sm:w-auto rounded-lg border-2 border-unlam-500 bg-transparent px-6 py-3 text-sm font-bold text-unlam-500 transition-all hover:bg-unlam-500/10 hover:shadow-md"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                ↓ Descubrir Más
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="mt-20 w-full max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="font-retro text-4xl sm:text-5xl text-app mb-3">
            Potencia Tu Carrera
          </h2>
          <p className="text-app/70 text-lg">Herramientas diseñadas para tu éxito académico</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-2xl border-2 border-unlam-500/20 bg-surface p-6 hover:border-unlam-500/60 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden"
            >
              {/* Hover gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-unlam-500/0 to-unlam-500/5 group-hover:from-unlam-500/5 group-hover:to-unlam-500/10 transition-all duration-300 -z-10" />
              
              <div className="text-5xl sm:text-6xl mb-4 group-hover:scale-125 transition-transform duration-300 origin-left">
                {feature.icon}
              </div>
              <h3 className="font-retro text-lg sm:text-xl text-app mb-2 group-hover:text-unlam-500 transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed group-hover:text-app transition-colors">
                {feature.description}
              </p>
              
              {/* Accent bar */}
              <div className="absolute bottom-0 left-0 w-0 h-1 bg-unlam-500 group-hover:w-full transition-all duration-300" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="mt-20 text-center">
        <p className="text-muted mb-6">¿Listo para optimizar tu carrera?</p>
        <RetroButton variant="primary" size="lg" onClick={onStart}>
          Empezar Ahora →
        </RetroButton>
      </div>
    </div>
  );
};
