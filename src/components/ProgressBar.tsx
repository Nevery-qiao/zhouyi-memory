import type { ProgressInfo } from '../models/types';

interface ProgressBarProps {
  progress: ProgressInfo;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="text-xs text-ink-muted text-center py-2 border-b border-card-border bg-parchment-light">
      <span>已掌握 <b className="text-ink">{progress.masteredCount}</b>/{progress.totalCards}</span>
      <span className="mx-2">·</span>
      <span>待复习 <b className="text-cinnabar">{progress.dueCount}</b></span>
      <span className="mx-2">·</span>
      <span>新卡 <b className="text-ink">{progress.newLearnedCount}</b></span>
    </div>
  );
}
