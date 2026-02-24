import { useEffect, useMemo, useState } from 'react';
import { fetchTrophyCase, checkAndUnlockTrophies } from './lib/trophies-api';
import type { TrophyCaseDto, TrophyDto } from './lib/trophies-api';
import { Trophy, CheckCircle, AlertTriangle } from 'lucide-react';

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

// Map tiers to local optimized assets
const TIER_ICONS: Record<string, string> = {
  BRONZE: '/bronze-trophie.png',
  SILVER: '/silver-trophie.png',
  GOLD: '/gold-trophie.png',
  PLATINUM: '/platinum-trophie.png',
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

      // OPTIMIZATION: Discard potentially heavy icon data from API if it exists
      // and rely on local mapping for display.
      const optimizedTrophies = data.trophies.map(t => ({
        ...t,
        icon: TIER_ICONS[t.tier] || '/bronze-trophie.png' // Force local asset
      }));

      setTrophyCase({
        ...data,
        trophies: optimizedTrophies
      });
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

  const [trophyMessage, setTrophyMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleCheckTrophies = async () => {
    try {
      setChecking(true);
      const newTrophies = await checkAndUnlockTrophies();
      if (newTrophies.length > 0) {
        await loadData();
        setTrophyMessage({ text: `¡Has desbloqueado ${newTrophies.length} nuevos trofeos!`, type: 'success' });
      } else {
        setTrophyMessage({ text: 'No hay nuevos trofeos desbloqueados por ahora.', type: 'info' });
      }
    } catch (err) {
      console.error('Error checking trophies:', err);
      setTrophyMessage({ text: 'Error al verificar trofeos.', type: 'error' });
    } finally {
      setChecking(false);
      setTimeout(() => setTrophyMessage(null), 4000);
    }
  };

  const trophiesByTier = useMemo(() => {
    if (!trophyCase) return [];

    const grouped = trophyCase.trophies.reduce((acc, trophy) => {
      const tier = trophy.tier;
      if (!acc[tier]) acc[tier] = [];
      acc[tier].push(trophy);
      return acc;
    }, {} as Record<string, TrophyDto[]>);

    return Object.entries(grouped).sort(
      ([tierA], [tierB]) => (TROPHY_TIER_ORDER[tierA] || 0) - (TROPHY_TIER_ORDER[tierB] || 0)
    );
  }, [trophyCase]);

  if (loading) return <div className="p-8 text-center text-muted font-retro animate-pulse">Cargando trofeos...</div>;
  if (error) return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;
  if (!trophyCase) return null;

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-app bg-elevated p-6 shadow-subtle flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-yellow-500/10 rounded-full border border-yellow-500/30">
            <Trophy className="w-8 h-8 text-yellow-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-app font-retro">
              Sala de trofeos
            </h3>
            <p className="text-sm text-muted mt-1">
              Progreso total: <span className="text-app font-bold text-lg">{trophyCase.unlockedPercentage}%</span>
              <span className="mx-2 opacity-50">|</span>
              {trophyCase.unlockedCount} de {trophyCase.totalTrophies} desbloqueados
            </p>
          </div>
        </div>

        <button
          onClick={handleCheckTrophies}
          disabled={checking}
          className="group relative overflow-hidden rounded-lg bg-unlam-500 px-6 py-2.5 text-sm font-bold text-black transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-md hover:shadow-unlam-500/20"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <span className="relative z-10 flex items-center gap-2">
            {checking ? (
              <>
                <span className="animate-spin">↻</span> Verificando...
              </>
            ) : (
              <>Verificar Trofeos</>
            )}
          </span>
        </button>
      </div>

      {trophyMessage && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold ${trophyMessage.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400'
          : trophyMessage.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
          }`}>
          {trophyMessage.type === 'success' ? <CheckCircle size={16} /> : trophyMessage.type === 'error' ? <AlertTriangle size={16} /> : <Trophy size={16} />}
          {trophyMessage.text}
          <button onClick={() => setTrophyMessage(null)} className="ml-auto text-muted hover:text-app">×</button>
        </div>
      )}

      <div className="space-y-10">
        {trophiesByTier.map(([tier, trophies]) => (
          <div key={tier} className="animate-fade-in-up">
            <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 px-3 py-1.5 border-l-4 inline-block rounded-r bg-surface ${TIER_COLORS[tier].split(' ')[1]}`}>
              {TIER_LABELS[tier] || tier}
            </h4>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {trophies.map((trophy) => (
                <div
                  key={trophy.code}
                  className={`relative overflow-hidden rounded-xl border p-4 shadow-subtle transition-all duration-300 ${trophy.unlocked
                    ? `bg-surface border-app ${TIER_COLORS[tier].split(' ')[1].replace('/30', '/50')} hover:-translate-y-1 hover:shadow-md`
                    : 'bg-elevated border-transparent opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 relative group-hover:scale-110 transition-transform duration-300">
                      <img
                        src={trophy.icon}
                        alt={trophy.name}
                        width={64}
                        height={64}
                        loading="lazy"
                        className="w-16 h-16 object-contain drop-shadow-md"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-app text-sm mb-1 truncate pr-2 font-retro">{trophy.name}</h5>
                      <p className="text-xs text-muted mb-2 leading-relaxed" title={trophy.description}>
                        {trophy.description}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-app-border/30">
                        <div className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${trophy.unlocked ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                          {trophy.unlocked ? 'Desbloqueado' : 'Bloqueado'}
                        </div>
                        {trophy.unlocked && trophy.unlockedAt && (
                          <span className="text-[10px] text-muted font-mono opacity-70">
                            {new Date(trophy.unlockedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!trophy.unlocked && trophy.progress > 0 && (
                    <div className="absolute bottom-0 left-0 h-1 bg-unlam-500/50 w-full bg-opacity-20">
                      <div className="h-full bg-unlam-500 transition-all duration-1000" style={{ width: `${trophy.progress}%` }} />
                    </div>
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
