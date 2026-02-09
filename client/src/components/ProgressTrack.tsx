import { useEffect, useState } from 'react';
import { PROGRESS_CHECKPOINTS } from '../lib/graph';

interface ProgressTrackProps {
  progress: number;
}

const RUNNER_OFFSET_PX = 13;
const CHECKPOINT_OFFSET_PX = 6;
const MIN_PROGRESS = 0;
const MAX_PROGRESS = 100;

export const ProgressTrack = ({ progress }: ProgressTrackProps) => {
  const clamped = Math.max(MIN_PROGRESS, Math.min(MAX_PROGRESS, progress));
  const [animationKey, setAnimationKey] = useState(0);

  const runnerLeft =
    clamped <= MIN_PROGRESS
      ? '0%'
      : clamped >= MAX_PROGRESS
        ? `calc(100% - ${RUNNER_OFFSET_PX}px)`
        : `calc(${clamped}% - ${RUNNER_OFFSET_PX}px)`;

  useEffect(() => {
    setAnimationKey((prev) => prev + 1);
  }, [clamped]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-sm text-muted mb-2">
        <span>Progreso de carrera</span>
        <span className="font-bold text-app">{clamped}%</span>
      </div>
      <div className="progress-track">
        <div
          key={animationKey}
          className="progress-fill progress-fill-animate"
          style={{ width: `${clamped}%` }}
        />
        <div
          className="progress-runner"
          style={{ left: runnerLeft }}
          aria-hidden="true"
        />
        {PROGRESS_CHECKPOINTS.map((checkpoint) => (
          <div
            key={checkpoint}
            className="progress-checkpoint"
            style={{ left: `calc(${checkpoint}% - ${CHECKPOINT_OFFSET_PX}px)` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted mt-2">
        <span>Inicio</span>
        <span>Meta</span>
      </div>
    </div>
  );
};
