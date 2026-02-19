import { useEffect, useState } from 'react';
import { Trophy, Award, Zap, Star } from 'lucide-react';
import { PROGRESS_CHECKPOINTS } from '../../../shared/lib/graph';

interface ProgressTrackProps {
  progress: number;
}

const CHARACTER_WIDTH = 48;
const CHARACTER_OFFSET = CHARACTER_WIDTH / 2;
const MIN_PROGRESS = 0;
const MAX_PROGRESS = 100;

const CHARACTER_GIF = "./animated-man-running.gif";

export const ProgressTrack = ({ progress }: ProgressTrackProps) => {
  const [displayedProgress, setDisplayedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayedProgress(Math.max(MIN_PROGRESS, Math.min(MAX_PROGRESS, progress)));
    }, 100);

    return () => clearTimeout(timer);
  }, [progress]);

  const clamped = displayedProgress;

  const runnerLeftCalc = `calc(${clamped}% - ${CHARACTER_OFFSET}px)`;

  const transitionClass = "transition-all duration-[10000ms] ease-in-out";

  return (
    <div className="w-full font-retro mb-8 relative">
      <div className="flex items-center justify-between text-sm text-muted mb-6">
        <span className="uppercase tracking-widest text-xs">Progreso de carrera</span>
        <div className="flex items-center gap-2">
          <span className="animate-pulse text-app-accent">Lv.{Math.floor(clamped / 10) + 1}</span>
          <span className="font-bold text-app text-lg border-2 border-app-border bg-app-surface px-2 rounded-sm shadow-retro transition-all">
            {clamped.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="relative h-7 w-full">
        <div className="absolute inset-0 bg-black/50 rounded-full border-2 border-app-border overflow-hidden z-0">
          <div
            className={`h-full bg-gradient-to-r from-unlam-900 via-unlam-500 to-retro-light relative flex items-center ${transitionClass}`}
            style={{ width: `${clamped}%` }}
          >
            {clamped > 0 && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 spark-edge z-10 pointer-events-none" />
            )}
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none z-10 font-retro">
          {PROGRESS_CHECKPOINTS.map((checkpoint) => {
            const isPassed = clamped >= checkpoint;
            let icon = null;
            let label = '';

            // Map checkpoints to explicit labels/icons
            if (checkpoint === 25) { label = '25% completado'; }
            else if (checkpoint === 50) { label = '50% completado'; icon = <Award size={10} className={isPassed ? "text-app-bg" : "text-app-border"} />; }
            else if (checkpoint === 75) { label = '75% completado'; icon = <Star size={10} className={isPassed ? "text-app-bg" : "text-app-border"} />; }
            else if (checkpoint === 100) { label = 'Ingeniero Informático'; icon = <Trophy size={10} className={isPassed ? "text-app-bg" : "text-app-border"} />; }

            return (
              <div
                key={checkpoint}
                className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-colors duration-500 flex items-center justify-center
                        ${isPassed
                    ? 'bg-app-accent border-white shadow-[0_0_10px_var(--app-accent)]'
                    : 'bg-app-bg border-app-border opacity-60'
                  }`}
                style={{ left: `calc(${checkpoint}% - 8px)` }}
              >
                {icon ? icon : <div className={`w-1 h-1 rounded-full ${isPassed ? 'bg-app-bg' : 'bg-transparent'}`}></div>}

                {/* Checkpoint Label below */}
                <div className={`absolute top-full mt-3 left-1/2 -translate-x-1/2 text-center whitespace-pre-line text-[10px] sm:text-xs uppercase tracking-widest font-bold transition-all duration-300 drop-shadow-md ${isPassed ? 'text-app-accent scale-105' : 'text-muted'}`}>
                  {label}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className={`absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none ${transitionClass}`}
          style={{ left: runnerLeftCalc }}
        >
          <img
            src={CHARACTER_GIF}
            alt="Runner"
            className="w-14 h-14 max-w-none object-contain image-rendering-pixelated drop-shadow-[0_8px_6px_rgba(0,0,0,0.6)]"
          />
        </div>
      </div>

      <div className="flex justify-between text-[10px] text-muted mt-6 uppercase tracking-wider font-bold px-1 items-center">
        <div className="flex flex-col items-center gap-1">
          <Zap size={14} className={clamped > 0 ? "text-app-accent" : "text-muted"} />
          <span className={clamped > 0 ? "text-app-accent drop-shadow-md" : "text-muted"}>Inicio</span>
        </div>
      </div>
    </div>
  );
};
