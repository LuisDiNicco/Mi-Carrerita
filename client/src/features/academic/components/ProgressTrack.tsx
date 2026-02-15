import { useEffect, useState } from 'react';
import { PROGRESS_CHECKPOINTS } from '../../../shared/lib/graph';

interface ProgressTrackProps {
  progress: number;
}

const CHARACTER_WIDTH = 48;
const CHARACTER_OFFSET = CHARACTER_WIDTH / 2;
const CHECKPOINT_OFFSET_VISUAL = 6;
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
              <>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 spark-edge z-10 pointer-events-none" />
                {/* Particles effect */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-white rounded-full opacity-70 animate-[particle_2s_ease-in-out_infinite]"
                      style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`,
                        top: `${20 + Math.random() * 60}%`,
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none z-10">
          {PROGRESS_CHECKPOINTS.map((checkpoint) => {
            const isPassed = clamped >= checkpoint;
            return (
              <div
                key={checkpoint}
                className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-colors duration-500
                        ${isPassed
                            ? 'bg-retro-light border-white shadow-[0_0_10px_var(--app-accent)]'
                            : 'bg-app-bg border-app-border opacity-50'
                        }`}
                style={{ left: `calc(${checkpoint}% - ${CHECKPOINT_OFFSET_VISUAL}px)` }}
              >
                <div className={`w-0.5 h-0.5 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isPassed ? 'bg-app-accent' : 'bg-transparent'}`}></div>
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

      <div className="flex justify-between text-[10px] text-muted mt-4 uppercase tracking-wider font-bold px-1">
        <span>Start</span>
        <span>Master</span>
      </div>
    </div>
  );
};
