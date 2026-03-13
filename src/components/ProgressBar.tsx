interface ProgressBarProps {
  currentIndex: number;
  queueLength: number;
}

export default function ProgressBar({ currentIndex, queueLength }: ProgressBarProps) {
  const pct = queueLength > 0 ? Math.round((currentIndex / queueLength) * 100) : 0;

  return (
    <div className="px-4 pt-3 pb-2 bg-parchment-light border-b border-card-border">
      <div className="h-1.5 bg-parchment-dark rounded-full overflow-hidden">
        <div
          className="h-full bg-jade rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-ink-muted text-center mt-1.5">
        {currentIndex} / {queueLength}
      </div>
    </div>
  );
}
