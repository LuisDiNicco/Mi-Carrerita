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
        <div className="max-w-4xl w-full flex flex-col items-center justify-center min-h-[80vh] text-center">

          {/* Badge */}
          <div className="mb-8 animate-fade-in-down">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface/90 backdrop-blur-sm border border-app-border rounded-full shadow-sm hover:border-app-accent transition-colors">
              <span className="h-2 w-2 rounded-full bg-unlam-500 animate-pulse" />
              <span className="font-retro text-xs text-app uppercase tracking-widest">
                Ingeniería en Informática - UNLAM
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-jersey text-7xl sm:text-8xl lg:text-9xl text-unlam-500 leading-none tracking-wide mb-8 animate-fade-in-up">
            MI CARRERITA
          </h1>

          {/* Description */}
          <p className="text-xl sm:text-2xl text-app/90 max-w-2xl mx-auto leading-relaxed font-mono mb-10 animate-fade-in-up delay-100">
            La plataforma <span className="text-unlam-500 font-bold">definitiva</span> para dominar tu carrera:
            visualización en tiempo real, análisis y recomendaciones IA.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up delay-200">
            <button
              onClick={onStart}
              className="group relative overflow-hidden rounded-full px-10 py-4 font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-unlam-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-unlam-600 via-unlam-500 to-unlam-600 bg-size-200 animate-gradient-xy" />
              <span className="relative z-10 text-white flex items-center justify-center gap-2">
                <span>Comenzar Ahora</span>
                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </button>

            <button
              className="rounded-full border border-app-border/50 bg-surface/50 backdrop-blur-sm px-10 py-4 text-lg font-bold text-app transition-all duration-300 hover:bg-surface hover:border-unlam-500/50"
              onClick={() => {
                const featuresEl = document.getElementById('features');
                if (featuresEl) {
                  featuresEl.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Descubrir Más
            </button>
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
