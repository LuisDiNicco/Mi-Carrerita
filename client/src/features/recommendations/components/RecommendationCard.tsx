import { Lock, Unlock } from 'lucide-react';

interface RecommendationCardProps {
    rec: any;
    index: number;
    isScheduled: boolean;
    isLocked: boolean;
    isExcluded: boolean;
    onToggleLock: (id: string) => void;
    onToggleExclude: (id: string) => void;
}

export function RecommendationCard({
    rec,
    index,
    isScheduled,
    isLocked,
    isExcluded,
    onToggleLock,
    onToggleExclude,
}: RecommendationCardProps) {
    return (
        <div
            className={`flex flex-col h-full rounded-xl border border-app p-4 transition-all shadow-subtle relative overflow-hidden group ${isLocked
                ? 'border-unlam-500 bg-unlam-500/5'
                : isExcluded
                    ? 'border-destructive/30 bg-destructive/5 opacity-50 grayscale hover:grayscale-0'
                    : 'bg-surface hover:border-unlam-500/50 hover:shadow-md'
                }`}
        >
            {isScheduled && (
                <div className="absolute top-0 right-0 bg-green-500 text-black text-[9px] font-bold uppercase px-2 py-0.5 rounded-bl-lg tracking-widest z-10">
                    Agendada
                </div>
            )}

            <div className="flex items-start justify-between mb-3 relative z-10">
                <div className="flex-1 pr-4">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-muted font-bold uppercase tracking-wider">
                            Prioridad #{index + 1}
                        </p>
                        <div className="text-[10px] text-center font-mono font-bold text-unlam-500 bg-app-bg px-2 py-0.5 rounded border border-unlam-500/20">
                            Score: {rec.score.toFixed(1)}
                        </div>
                    </div>
                    <h4 className="text-base font-bold text-app leading-tight mb-1">{rec.subject.name}</h4>
                    <p className="text-[10px] text-muted font-mono bg-app-bg inline-block px-1.5 rounded">Cód: {rec.subject.planCode}</p>
                </div>
            </div>

            {rec.reasons.length > 0 && (
                <div className="space-y-1.5 mb-4 border-l-2 border-unlam-500/30 pl-2">
                    {rec.reasons.map((reason: string, idx: number) => (
                        <div key={idx} className="text-[11px] text-app">
                            {reason}
                        </div>
                    ))}
                </div>
            )}

            <div className="flex gap-2 mt-auto">
                <button
                    onClick={() => onToggleLock(rec.subject.id)}
                    disabled={isExcluded}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all ${isLocked
                        ? 'bg-unlam-500 text-black'
                        : 'border border-app text-app hover:bg-surface'
                        } disabled:opacity-40`}
                >
                    {isLocked ? <Lock size={12} className="mr-1" /> : <Unlock size={12} className="mr-1" />}
                    {isLocked ? 'Fijada' : 'Fijar'}
                </button>
                <button
                    onClick={() => onToggleExclude(rec.subject.id)}
                    disabled={isLocked}
                    className={`flex-1 px-2 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all ${isExcluded
                        ? 'bg-destructive/20 text-destructive border border-destructive/50'
                        : 'border border-app text-app hover:bg-surface'
                        } disabled:opacity-40`}
                >
                    {isExcluded ? 'Omitida' : 'Omitir'}
                </button>
            </div>
        </div>
    );
}

