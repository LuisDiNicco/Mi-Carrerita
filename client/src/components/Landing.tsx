import { RetroButton } from './ui/RetroButton';

interface LandingProps {
  onStart: () => void;
}

const FEATURES = [
  'Arbol de materias con correlatividades claras',
  'Dashboard con progreso y proyecciones',
  'Historia academica editable',
  'Recomendaciones de cursada optimizadas',
  'Camino critico resaltado para avanzar rapido',
];

export const Landing = ({ onStart }: LandingProps) => {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-widest text-muted">Bienvenido</p>
        <h2 className="text-4xl font-bold text-app">Tu carrera, clara y visual</h2>
        <p className="text-base text-muted">
          Mi Carrerita te ayuda a planificar, medir y mostrar tu avance academico con una
          interfaz limpia, retro y profesional.
        </p>
        <RetroButton variant="primary" size="lg" onClick={onStart}>
          Ver arbol de materias
        </RetroButton>
      </div>
      <div className="rounded-2xl border border-app bg-elevated p-5 shadow-subtle">
        <h3 className="text-lg font-bold text-app mb-3">Lo que podes hacer</h3>
        <ul className="space-y-2 text-sm text-muted">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <span className="text-app">•</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
