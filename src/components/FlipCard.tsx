import { useState, useEffect } from 'react';
import type { Card, FlipQuality } from '../models/types';

interface FlipCardProps {
  card: Card;
  onAnswer: (quality: FlipQuality) => void;
}

export default function FlipCard({ card, onAnswer }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);

  // 新卡片时重置翻转状态
  useEffect(() => {
    setFlipped(false);
    setFadeKey(prev => prev + 1);
  }, [card.id]);

  const isSymbol = card.type === 'A' || card.type === 'G';

  return (
    <div key={fadeKey} className="card-fade-enter flex flex-col items-center">
      {/* 卡片 */}
      <div
        onClick={() => !flipped && setFlipped(true)}
        className={`w-full bg-card-bg border border-card-border rounded-xl p-8 min-h-[280px] flex flex-col items-center justify-center cursor-pointer select-none transition-shadow ${
          !flipped ? 'hover:shadow-md' : ''
        }`}
      >
        {!flipped ? (
          /* 正面 */
          <div className="text-center">
            <div className={`${isSymbol ? 'hexagram-symbol text-7xl' : 'text-4xl font-bold'} text-ink mb-4`}>
              {card.front}
            </div>
            <div className="text-ink-muted text-sm">
              {card.type === 'A' && '此为何卦？'}
              {card.type === 'C' && '卦辞为何？'}
              {card.type === 'G' && '上下卦为何？'}
            </div>
            <div className="mt-6 text-ink-muted/50 text-xs">点击翻转</div>
          </div>
        ) : (
          /* 背面 */
          <div className="text-center card-fade-enter">
            <div className="text-xs text-ink-muted mb-3">
              {card.type === 'A' && '卦名'}
              {card.type === 'C' && '卦辞'}
              {card.type === 'G' && '上下卦构成'}
            </div>
            <div className={`${card.type === 'C' ? 'text-xl leading-relaxed' : 'text-3xl font-bold'} text-ink max-h-[40vh] overflow-y-auto`}>
              {card.back}
            </div>
          </div>
        )}
      </div>

      {/* 自评按钮（翻转后显示） */}
      {flipped && (
        <div className="w-full mt-6 grid grid-cols-3 gap-3 card-fade-enter">
          <button
            onClick={() => onAnswer(1)}
            className="py-3 rounded-lg border border-wrong/30 bg-wrong/5 text-wrong font-semibold text-sm hover:bg-wrong/10 active:scale-95 transition-all"
          >
            不会
          </button>
          <button
            onClick={() => onAnswer(3)}
            className="py-3 rounded-lg border border-cinnabar/30 bg-cinnabar/5 text-cinnabar font-semibold text-sm hover:bg-cinnabar/10 active:scale-95 transition-all"
          >
            想起来了
          </button>
          <button
            onClick={() => onAnswer(5)}
            className="py-3 rounded-lg border border-jade/30 bg-jade/5 text-jade font-semibold text-sm hover:bg-jade/10 active:scale-95 transition-all"
          >
            很简单
          </button>
        </div>
      )}
    </div>
  );
}
