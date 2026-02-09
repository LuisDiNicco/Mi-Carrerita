interface ProgressTrackProps {
  progress: number;
}

const checkpoints = [25, 50, 75, 100];

export const ProgressTrack = ({ progress }: ProgressTrackProps) => {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-sm text-muted mb-2">
        <span>Progreso de carrera</span>
        <span className="font-bold text-app">{clamped}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${clamped}%` }} />
        <div
          className="progress-runner"
          style={{ left: `calc(${clamped}% - 12px)` }}
          aria-hidden="true"
        />
        {checkpoints.map((checkpoint) => (
          <div
            key={checkpoint}
            className="progress-checkpoint"
            style={{ left: `calc(${checkpoint}% - 5px)` }}
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
