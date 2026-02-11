import { RetroButton } from '../../shared/ui/RetroButton';

interface LandingProps {
  onStart: () => void;
}

const FEATURES = [
  'Arbol de materias claro',
  'Dashboard de progreso',
  'Historia academica editable',
  'Recomendaciones optimizadas',
  'Camino critico visible',
];

export const Landing = ({ onStart }: LandingProps) => {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-widest text-muted">Bienvenido</p>
        <h2 className="text-5xl font-bold text-app">Mi Carrerita</h2>
        <p className="text-base text-muted">
          Visualiza tu avance, correlatividades y logros en un solo lugar.
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
