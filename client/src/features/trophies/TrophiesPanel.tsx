import { useEffect, useMemo, useState } from 'react';
import { fetchTrophyCase, checkAndUnlockTrophies } from './lib/trophies-api';
import type { TrophyCaseDto, TrophyDto } from './lib/trophies-api';
import { Trophy } from 'lucide-react';

const TROPHY_TIER_ORDER: Record<string, number> = {
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
  PLATINUM: 4,
};

const TIER_LABELS: Record<string, string> = {
  BRONZE: 'Bronce',
  SILVER: 'Plata',
  GOLD: 'Oro',
  PLATINUM: 'Platino',
};

const TIER_COLORS: Record<string, string> = {
  BRONZE: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  SILVER: 'text-slate-400 border-slate-400/30 bg-slate-400/10',
  GOLD: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  PLATINUM: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
};

export const TrophiesPanel = () => {
  const [trophyCase, setTrophyCase] = useState<TrophyCaseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchTrophyCase();
      setTrophyCase(data);
    } catch (err) {
      console.error("Error loading trophies:", err);
      setError("No se pudieron cargar los trofeos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCheckTrophies = async () => {
    try {
      setChecking(true);
      const newTrophies = await checkAndUnlockTrophies();
      if (newTrophies.length > 0) {
        // Reload to get updated case
        await loadData();
        // Ideally show a toast or modal here
        alert(`¡Has desbloqueado ${newTrophies.length} nuevos trofeos!`);
      } else {
        alert("No hay nuevos trofeos desbloqueados por ahora.");
      }
    } catch (err) {
      console.error("Error checking trophies:", err);
      alert("Error al verificar trofeos.");
    } finally {
      setChecking(false);
    }
  };

  const trophiesByTier = useMemo(() => {
    if (!trophyCase) return [];

    // Group by tier
    const grouped = trophyCase.trophies.reduce((acc, trophy) => {
      const tier = trophy.tier;
      if (!acc[tier]) acc[tier] = [];
      acc[tier].push(trophy);
      return acc;
    }, {} as Record<string, TrophyDto[]>);

    // Sort tiers
    return Object.entries(grouped).sort(
      ([tierA], [tierB]) => (TROPHY_TIER_ORDER[tierA] || 0) - (TROPHY_TIER_ORDER[tierB] || 0)
    );
  }, [trophyCase]);

  if (loading) return <div className="p-8 text-center text-muted">Cargando trofeos...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!trophyCase) return null;

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-app bg-elevated p-4 shadow-subtle flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-app flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Sala de trofeos
          </h3>
          <p className="text-sm text-muted">
            Progreso total: <span className="text-app font-bold">{trophyCase.unlockedPercentage}%</span> ({trophyCase.unlockedCount}/{trophyCase.totalTrophies})
          </p>
        </div>
        <button
          onClick={handleCheckTrophies}
          disabled={checking}
          className="rounded-lg bg-unlam-500 px-4 py-2 text-sm font-bold text-black transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
        >
          {checking ? 'Verificando...' : 'Verificar Trofeos'}
        </button>
      </div>

      <div className="space-y-8">
        {trophiesByTier.map(([tier, trophies]) => (
          <div key={tier}>
            <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 px-2 border-l-4 pl-2 ${TIER_COLORS[tier].split(' ')[1]}`}>
              {TIER_LABELS[tier] || tier}
            </h4>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {trophies.map((trophy) => (
                <div
                  key={trophy.code}
                  className={`relative overflow-hidden rounded-xl border p-4 shadow-subtle transition-all ${trophy.unlocked
                    ? `bg-surface border-app ${TIER_COLORS[tier].split(' ')[1].replace('/30', '/50')}`
                    : 'bg-elevated border-transparent opacity-60 grayscale'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0">
                      {/* Fallback icon if image fails or using placeholder */}
                      <img
                        src={trophy.icon}
                        alt={trophy.name}
                        className="w-12 h-12 rounded bg-black/20 p-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/bronze-trophie.png'; // Fallback
                        }}
                      />
                    </div>
                    <div>
                      <h5 className="font-bold text-app text-sm mb-1">{trophy.name}</h5>
                      <p className="text-xs text-muted mb-2 line-clamp-2" title={trophy.description}>
                        {trophy.description}
                      </p>
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted font-mono">
                        <span>{trophy.unlocked ? 'Desbloqueado' : 'Bloqueado'}</span>
                        {trophy.unlocked && trophy.unlockedAt && (
                          <span>{new Date(trophy.unlockedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar for locked trophies if available */}
                  {!trophy.unlocked && trophy.progress > 0 && (
                    <div className="absolute bottom-0 left-0 h-1 bg-unlam-500" style={{ width: `${trophy.progress}%` }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
