import type { Hexagram } from '../models/types';
import { getCardState } from '../storage/localStorage';

interface HexagramDetailPageProps {
  hex: Hexagram;
  onBack: () => void;
}

const CARD_LABELS = [
  { type: 'A', label: '卦象 → 卦名' },
  { type: 'C', label: '卦名 → 卦辞' },
  { type: 'G', label: '卦象 → 上下卦' },
] as const;

export default function HexagramDetailPage({ hex, onBack }: HexagramDetailPageProps) {
  return (
    <div className="min-h-dvh bg-parchment">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-card-border bg-parchment-light">
        <button onClick={onBack} className="text-sm text-ink-muted hover:text-ink">&larr; 返回</button>
        <h1 className="text-lg font-bold text-ink ml-4">{hex.name}</h1>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 animate-fade-in">
        {/* Symbol + Name */}
        <div className="text-center mb-6">
          <div className="hexagram-symbol text-7xl text-ink mb-2">{hex.symbol}</div>
          <div className="text-3xl font-bold text-ink">{hex.name}</div>
        </div>

        {/* Judgment */}
        <div className="bg-card-bg border border-card-border rounded-xl p-6 mb-4">
          <div className="text-xs text-ink-muted mb-2">卦辞</div>
          <div className="text-lg text-ink leading-relaxed">{hex.judgment}</div>
          <div className="text-sm text-ink-light mt-3 leading-relaxed border-t border-card-border pt-3">
            {hex.judgmentTranslation}
          </div>
        </div>

        {/* Trigrams */}
        <div className="bg-card-bg border border-card-border rounded-xl p-6 mb-4 grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-xs text-ink-muted mb-1">上卦</div>
            <div className="hexagram-symbol text-2xl">{hex.upperTrigramSymbol}</div>
            <div className="text-sm text-ink mt-1">{hex.upperTrigram}</div>
          </div>
          <div>
            <div className="text-xs text-ink-muted mb-1">下卦</div>
            <div className="hexagram-symbol text-2xl">{hex.lowerTrigramSymbol}</div>
            <div className="text-sm text-ink mt-1">{hex.lowerTrigram}</div>
          </div>
        </div>

        {/* Card states */}
        <div className="bg-card-bg border border-card-border rounded-xl p-6">
          <div className="text-xs text-ink-muted mb-3">学习状态</div>
          {CARD_LABELS.map(({ type, label }) => {
            const state = getCardState(`${hex.id}-${type}`);
            const studied = state && state.lastReviewDate !== '';
            const reps = state?.repetitions ?? 0;
            return (
              <div key={type} className="flex items-center justify-between py-2 border-b border-card-border last:border-0">
                <span className="text-sm text-ink">{label}</span>
                <span className={`text-xs ${studied ? (reps >= 4 ? 'text-jade' : 'text-cinnabar') : 'text-ink-muted/50'}`}>
                  {!studied ? '未学习' : reps >= 4 ? '已掌握' : `学习中 (${reps}/4)`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
