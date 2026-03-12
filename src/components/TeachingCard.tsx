import { useState } from 'react';
import type { Card } from '../models/types';
import { getHexagramById } from '../logic/cardGenerator';

interface TeachingCardProps {
  card: Card;
  onDone: () => void;
}

export default function TeachingCard({ card, onDone }: TeachingCardProps) {
  const [showTranslation, setShowTranslation] = useState(false);
  const hex = getHexagramById(card.hexagramId);

  if (!hex) return null;

  return (
    <div className="card-fade-enter flex flex-col items-center">
      <div className="w-full bg-card-bg border border-card-border rounded-xl p-8 text-center">
        {/* Hexagram symbol */}
        <div className="hexagram-symbol text-7xl text-ink mb-2">{hex.symbol}</div>
        {hex.trigram && (
          <div className="hexagram-symbol text-3xl text-ink-muted mb-4">{hex.trigram}</div>
        )}

        {/* Name */}
        <div className="text-3xl font-bold text-ink mb-6">{hex.name}</div>

        {/* Judgment */}
        <div className="text-left border-t border-card-border pt-4 mb-4">
          <div className="text-xs text-ink-muted mb-2">卦辞</div>
          <div className="text-lg text-ink leading-relaxed">{hex.judgment}</div>
          {!showTranslation ? (
            <button
              onClick={() => setShowTranslation(true)}
              className="text-xs text-cinnabar mt-2 hover:underline"
            >
              查看白话翻译
            </button>
          ) : (
            <div className="text-sm text-ink-light mt-2 leading-relaxed card-fade-enter">
              {hex.judgmentTranslation}
            </div>
          )}
        </div>

        {/* Upper/Lower trigrams */}
        <div className="border-t border-card-border pt-4 grid grid-cols-2 gap-4 text-center">
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
      </div>

      {/* Done button */}
      <button
        onClick={onDone}
        className="w-full mt-6 py-3.5 bg-cinnabar text-white rounded-lg font-semibold tracking-wider hover:bg-cinnabar-dark active:scale-[0.98] transition-all"
      >
        知道了
      </button>
    </div>
  );
}
