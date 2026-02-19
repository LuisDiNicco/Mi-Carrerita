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
      <div className="relative flex flex-col items-center justify-start px-4 sm:px-6">

        {/* Badge - enhanced impact & linked (Moved to top-left) */}
        <div className="absolute top-0 left-0 sm:left-6 animate-fade-in-down z-20">
          <a
            href="https://ingenieria.unlam.edu.ar/index.php?seccion=3&idArticulo=10"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 px-4 py-2 sm:px-6 sm:py-3 bg-surface/80 backdrop-blur-md border border-app-border rounded-full shadow-[0_0_15px_rgba(34,197,94,0.15)] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:border-unlam-500 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-unlam-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-full w-full bg-unlam-500 transition-colors group-hover:bg-unlam-400"></span>
            </span>
            <div className="flex flex-col items-start leading-none">
              <span className="font-retro text-[8px] sm:text-[10px] text-app-foreground/60 uppercase tracking-widest mb-0.5 sm:mb-1 group-hover:text-app-foreground/80 transition-colors">
                Carrera de Grado
              </span>
              <span className="font-bold text-xs sm:text-sm text-app group-hover:text-unlam-500 transition-colors font-mono">
                INGENIERÍA EN INFORMÁTICA @ UNLAM
              </span>
            </div>
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-app-foreground/40 group-hover:text-unlam-500 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        </div>

        {/* Hero Section - Full Screen Centered minus header */}
        <div className="min-h-[calc(100vh-5rem)] w-full max-w-4xl flex flex-col items-center justify-center text-center pb-20 pt-16 sm:pt-0">

          {/* Title - larger per request */}
          <h1 className="font-jersey text-7xl sm:text-8xl lg:text-9xl text-unlam-500 leading-[0.85] tracking-normal mb-6 animate-fade-in-up drop-shadow-2xl">
            MI<br />CARRERITA
          </h1>

          {/* Description - smaller per request */}
          <p className="text-base sm:text-lg text-app/90 max-w-xl mx-auto leading-relaxed font-mono mb-10 animate-fade-in-up delay-100">
            La plataforma <span className="text-unlam-500 font-bold border-b-2 border-unlam-500/20 px-1">definitiva</span> para dominar tu carrera:
            visualización en tiempo real, análisis y recomendaciones IA.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center animate-fade-in-up delay-200">
            <button
              onClick={onStart}
              className="group relative overflow-hidden rounded-full px-10 py-4 font-bold text-lg transition-all duration-300 hover:scale-110 hover:shadow-[0_0_40px_rgba(34,197,94,0.4)] ring-2 ring-transparent hover:ring-unlam-500/50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-unlam-600 via-unlam-500 to-unlam-600 bg-size-200 animate-gradient-xy" />
              <span className="relative z-10 text-white flex items-center justify-center gap-3">
                <span>Comenzar Ahora</span>
                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </button>

            <button
              className="rounded-full border border-app-border/50 bg-surface/50 backdrop-blur-sm px-10 py-4 text-lg font-bold text-app transition-all duration-300 hover:bg-surface hover:border-unlam-500/50 hover:scale-105"
              onClick={() => {
                const featuresEl = document.getElementById('features');
                if (featuresEl) {
                  // Scroll slightly DOWN into the section to show more cards
                  const y = featuresEl.getBoundingClientRect().top + window.pageYOffset + 5;
                  window.scrollTo({ top: y, behavior: 'smooth' });
                }
              }}
            >
              Descubrir Más
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="w-full max-w-6xl pt-24 pb-20">
          <div className="text-center mb-16">
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
