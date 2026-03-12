import { useState } from 'react';
import { hexagrams } from '../data/hexagrams';
import { getHexagramMastery } from '../logic/studyQueue';
import type { MasteryLevel } from '../models/types';
import HexagramDetailPage from './HexagramDetailPage';

interface DictionaryPageProps {
  onBack: () => void;
}

const MASTERY_STYLES: Record<MasteryLevel, { label: string; color: string; bg: string }> = {
  unlearned: { label: '未学习', color: 'text-ink-muted/50', bg: 'bg-parchment-dark' },
  learning: { label: '学习中', color: 'text-cinnabar', bg: 'bg-cinnabar/10' },
  mastered: { label: '已掌握', color: 'text-jade', bg: 'bg-jade/10' },
};

export default function DictionaryPage({ onBack }: DictionaryPageProps) {
  const [selectedHexId, setSelectedHexId] = useState<number | null>(null);

  if (selectedHexId !== null) {
    const hex = hexagrams.find(h => h.id === selectedHexId)!;
    return <HexagramDetailPage hex={hex} onBack={() => setSelectedHexId(null)} />;
  }

  const masteredCount = hexagrams.filter(h => getHexagramMastery(h.id) === 'mastered').length;

  return (
    <div className="min-h-dvh bg-parchment">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-card-border bg-parchment-light">
        <button onClick={onBack} className="text-sm text-ink-muted hover:text-ink">&larr; 返回</button>
        <h1 className="text-lg font-bold text-ink">卦典</h1>
        <div className="text-xs text-ink-muted">已掌握 {masteredCount}/64</div>
      </div>

      {/* Hexagram list */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-2">
        {hexagrams.map(hex => {
          const mastery = getHexagramMastery(hex.id);
          const style = MASTERY_STYLES[mastery];
          return (
            <button
              key={hex.id}
              onClick={() => setSelectedHexId(hex.id)}
              className="w-full flex items-center gap-4 p-3 bg-card-bg border border-card-border rounded-lg hover:shadow-sm transition-shadow text-left"
            >
              <div className="hexagram-symbol text-2xl w-8 text-center">{hex.symbol}</div>
              <div className="flex-1">
                <div className="text-base font-semibold text-ink">{hex.name}</div>
                <div className="text-xs text-ink-muted truncate">{hex.judgment}</div>
              </div>
              <div className={`text-xs px-2 py-1 rounded ${style.bg} ${style.color}`}>
                {style.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
