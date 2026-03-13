import { useState, useMemo } from 'react';
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

const TRIGRAMS = ['乾', '坤', '震', '巽', '坎', '离', '艮', '兑'] as const;
const TRIGRAM_SYMBOLS: Record<string, string> = {
  '乾': '☰', '坤': '☷', '震': '☳', '巽': '☴',
  '坎': '☵', '离': '☲', '艮': '☶', '兑': '☱',
};

type FilterDimension = 'lower' | 'upper';

export default function DictionaryPage({ onBack }: DictionaryPageProps) {
  const [selectedHexId, setSelectedHexId] = useState<number | null>(null);
  const [filterDim, setFilterDim] = useState<FilterDimension>('lower');
  const [filterTrigram, setFilterTrigram] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!filterTrigram) return hexagrams;
    return hexagrams.filter(h =>
      filterDim === 'lower' ? h.lowerTrigram === filterTrigram : h.upperTrigram === filterTrigram
    );
  }, [filterTrigram, filterDim]);

  if (selectedHexId !== null) {
    const hex = hexagrams.find(h => h.id === selectedHexId)!;
    return <HexagramDetailPage hex={hex} onBack={() => setSelectedHexId(null)} />;
  }

  const masteredCount = hexagrams.filter(h => getHexagramMastery(h.id) === 'mastered').length;

  const handleTrigramClick = (name: string) => {
    setFilterTrigram(prev => prev === name ? null : name);
  };

  return (
    <div className="min-h-dvh bg-parchment">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-card-border bg-parchment-light">
        <button onClick={onBack} className="text-sm text-ink-muted hover:text-ink">&larr; 返回</button>
        <h1 className="text-lg font-bold text-ink">卦典</h1>
        <div className="text-xs text-ink-muted">已掌握 {masteredCount}/64</div>
      </div>

      {/* Filter */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* Dimension toggle */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex bg-parchment-dark rounded-md p-0.5">
            <button
              onClick={() => { setFilterDim('lower'); setFilterTrigram(null); }}
              className={`px-3 py-1 text-xs rounded transition-all ${
                filterDim === 'lower' ? 'bg-card-bg text-ink shadow-sm font-semibold' : 'text-ink-muted'
              }`}
            >
              下卦
            </button>
            <button
              onClick={() => { setFilterDim('upper'); setFilterTrigram(null); }}
              className={`px-3 py-1 text-xs rounded transition-all ${
                filterDim === 'upper' ? 'bg-card-bg text-ink shadow-sm font-semibold' : 'text-ink-muted'
              }`}
            >
              上卦
            </button>
          </div>
          {filterTrigram && (
            <button
              onClick={() => setFilterTrigram(null)}
              className="text-xs text-ink-muted hover:text-ink"
            >
              清除筛选
            </button>
          )}
        </div>
        {/* Trigram chips */}
        <div className="flex gap-2 flex-wrap mb-4">
          {TRIGRAMS.map(name => (
            <button
              key={name}
              onClick={() => handleTrigramClick(name)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-sm transition-all ${
                filterTrigram === name
                  ? 'border-cinnabar bg-cinnabar/10 text-cinnabar font-semibold'
                  : 'border-card-border bg-card-bg text-ink-muted hover:border-cinnabar/40'
              }`}
            >
              <span className="hexagram-symbol text-base">{TRIGRAM_SYMBOLS[name]}</span>
              <span>{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hexagram list */}
      <div className="max-w-lg mx-auto px-4 pb-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center text-sm text-ink-muted py-8">无匹配结果</div>
        ) : (
          filtered.map(hex => {
            const mastery = getHexagramMastery(hex.id);
            const style = MASTERY_STYLES[mastery];
            return (
              <button
                key={hex.id}
                onClick={() => setSelectedHexId(hex.id)}
                className="w-full flex items-center gap-4 p-3 bg-card-bg border border-card-border rounded-lg hover:shadow-sm transition-shadow text-left"
              >
                <div className="hexagram-symbol text-2xl w-8 text-center">{hex.symbol}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold text-ink">{hex.name}</div>
                  <div className="text-xs text-ink-muted truncate">{hex.judgment}</div>
                </div>
                <div className={`text-xs px-2 py-1 rounded whitespace-nowrap shrink-0 ${style.bg} ${style.color}`}>
                  {style.label}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
