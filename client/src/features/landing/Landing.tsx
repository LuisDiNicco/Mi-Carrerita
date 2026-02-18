import { BarChart3, GitBranch, Target, Trophy } from 'lucide-react';

interface LandingProps {
  onStart: () => void;
}

interface Feature {
  icon: typeof BarChart3;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: BarChart3,
    title: 'Dashboard Completo',
    description: 'Estadísticas avanzadas, gráficos interactivos y proyección inteligente de finalización',
  },
  {
    icon: GitBranch,
    title: 'Árbol Interactivo',
    description: 'Visualiza materias, correlatividades y tu progreso en tiempo real con grafos dinámicos',
  },
  {
    icon: Target,
    title: 'Recomendaciones IA',
    description: 'Planes personalizados basados en algoritmos de ruta crítica y tus objetivos',
  },
  {
    icon: Trophy,
    title: 'Sistema de Logros',
    description: 'Desbloquea trofeos y achievements a medida que avanzas en tu carrera',
  },
];

export const Landing = ({ onStart }: LandingProps) => {
  return (
    <div className="min-h-screen bg-app-bg">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-app-bg via-app-elevated/20 to-app-bg pointer-events-none" />

      <div className="relative flex flex-col items-center justify-start pt-16 pb-24 px-4 sm:px-6">
        {/* Hero Section Redesigned */}
        <div className="max-w-5xl w-full mb-20">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface/90 backdrop-blur-sm border border-app-border rounded-full shadow-sm hover:border-app-accent transition-colors">
              <span className="h-2 w-2 rounded-full bg-unlam-500" />
              <span className="font-retro text-xs text-app uppercase tracking-widest">
                Ingeniería en Informática - UNLAM
              </span>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left: Title and Description */}
            <div className="text-center lg:text-left space-y-6">
              <h1 className="font-jersey text-6xl sm:text-7xl lg:text-8xl text-unlam-500 leading-tight tracking-wide">
                MI CARRERITA
              </h1>

              <p className="text-lg sm:text-xl text-app max-w-lg mx-auto lg:mx-0 leading-relaxed font-mono">
                La plataforma <span className="text-unlam-500 font-bold">definitiva</span> para dominar tu carrera académica:
                visualización en tiempo real, análisis de datos y recomendaciones personalizadas impulsadas por IA.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-4">
                <button
                  onClick={onStart}
                  className="group relative overflow-hidden rounded-lg px-8 py-3.5 font-bold text-base transition-all duration-300 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-unlam-600 via-unlam-500 to-unlam-600 bg-size-200 group-hover:bg-pos-100 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative z-10 text-white flex items-center justify-center gap-2">
                    <span>Comenzar Ahora</span>
                    <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </button>

                <button
                  className="rounded-lg border-2 border-unlam-500 bg-transparent px-8 py-3.5 text-base font-bold text-unlam-500 transition-all duration-300 hover:bg-unlam-500/10"
                  onClick={() => {
                    const featuresEl = document.getElementById('features');
                    if (featuresEl) {
                      const yOffset = -80; // Offset to avoid covering title
                      const y = featuresEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }}
                >
                  Descubrir Más
                </button>
              </div>
            </div>

            {/* Right: Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '63', label: 'Materias' },
                { value: '5', label: 'Años' },
                { value: '100%', label: 'Gratis' },
                { value: '∞', label: 'Updates' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="group rounded-xl border-2 border-unlam-500/30 bg-surface/80 backdrop-blur-sm p-6 hover:border-unlam-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="font-mono font-bold text-5xl text-unlam-500 tracking-tight group-hover:text-unlam-400 transition-colors mb-2">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted uppercase tracking-widest font-semibold">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="w-full max-w-6xl pt-12">
          <div className="text-center mb-12">
            <h2 className="font-retro text-4xl sm:text-5xl text-app mb-4 font-bold">
              Potencia Tu Carrera
            </h2>
            <p className="text-app/70 text-lg max-w-2xl mx-auto">
              Herramientas profesionales diseñadas para maximizar tu éxito académico
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative rounded-2xl border-2 border-unlam-500/25 bg-surface/80 backdrop-blur-sm p-6 hover:border-unlam-500/70 transition-all duration-300 hover:shadow-lg hover:-translate-y-2 overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-unlam-500/0 via-unlam-500/5 to-unlam-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 rounded-2xl" />

                  <div className="mb-4 text-unlam-500 transition-all duration-300 transform group-hover:scale-110">
                    <IconComponent size={48} strokeWidth={1.5} />
                  </div>

                  <h3 className="font-retro text-xl sm:text-2xl text-app mb-3 font-bold group-hover:text-unlam-500 transition-colors duration-300">
                    {feature.title}
                  </h3>

                  <p className="text-sm text-muted leading-relaxed group-hover:text-app transition-colors duration-300">
                    {feature.description}
                  </p>

                  <div className="absolute bottom-0 left-0 w-0 h-1.5 bg-gradient-to-r from-unlam-500 to-unlam-400 group-hover:w-full transition-all duration-500 rounded-full" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-20 text-center">
          <p className="text-muted mb-6 text-lg">¿Listo para transformar tu experiencia académica?</p>
          <button
            onClick={onStart}
            className="group relative overflow-hidden rounded-lg px-10 py-4 font-bold text-lg transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-unlam-600 via-unlam-500 to-unlam-600 bg-size-200 group-hover:bg-pos-100 transition-all duration-500" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative z-10 text-white flex items-center justify-center gap-2">
              <span>Empezar Ahora</span>
              <span className="transform group-hover:translate-x-1 transition-transform duration-300">→</span>
            </span>
          </button>
        </div>
      </div>

      <style>{`
        .bg-size-200 {
          background-size: 200% 100%;
        }
        .bg-pos-100 {
          background-position: 100% 50%;
        }
      `}</style>
    </div>
  );
};
