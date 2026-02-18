import { useState, useEffect } from 'react';
import type { Card, QuizOption, QuizQuality } from '../models/types';

interface QuizCardProps {
  card: Card;
  options: QuizOption[];
  onAnswer: (quality: QuizQuality) => void;
}

export default function QuizCard({ card, options, onAnswer }: QuizCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [fadeKey, setFadeKey] = useState(0);

  const answered = selected !== null;
  const isCorrect = selected !== null && options[selected]?.isCorrect;

  // 新卡片时重置状态
  useEffect(() => {
    setSelected(null);
    setFadeKey(prev => prev + 1);
  }, [card.id]);

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelected(index);
  };

  const handleNext = () => {
    onAnswer(isCorrect ? 4 : 1);
  };

  const isSymbol = card.type === 'A' || card.type === 'G';

  return (
    <div key={fadeKey} className="card-fade-enter flex flex-col items-center">
      {/* 题面 */}
      <div className="w-full bg-card-bg border border-card-border rounded-xl p-8 min-h-[160px] flex flex-col items-center justify-center mb-6">
        <div className="text-xs text-ink-muted mb-3">
          {card.type === 'A' && '此为何卦？'}
          {card.type === 'C' && '卦辞为何？'}
          {card.type === 'G' && '上下卦为何？'}
        </div>
        <div className={`${isSymbol ? 'hexagram-symbol text-7xl' : 'text-4xl font-bold'} text-ink`}>
          {card.front}
        </div>
      </div>

      {/* 选项 */}
      <div className="w-full space-y-3">
        {options.map((option, index) => {
          let style = 'border-card-border bg-card-bg text-ink hover:border-cinnabar/40';

          if (answered) {
            if (option.isCorrect) {
              style = 'border-jade bg-jade/10 text-jade-dark';
            } else if (index === selected) {
              style = 'border-wrong bg-wrong/10 text-wrong';
            } else {
              style = 'border-card-border bg-card-bg text-ink-muted/50';
            }
          }

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={answered}
              className={`w-full py-3 px-4 rounded-lg border text-left text-sm transition-all ${style} ${
                !answered ? 'active:scale-[0.98] cursor-pointer' : 'cursor-default'
              }`}
            >
              <span className={`${card.type === 'C' ? 'line-clamp-2' : ''}`}>
                {option.text}
              </span>
            </button>
          );
        })}
      </div>

      {/* 反馈与继续按钮 */}
      {answered && (
        <div className="w-full mt-6 card-fade-enter">
          <div className={`text-center text-sm mb-4 ${isCorrect ? 'text-jade' : 'text-wrong'}`}>
            {isCorrect ? '回答正确' : '回答错误'}
          </div>
          <button
            onClick={handleNext}
            className="w-full py-3 bg-cinnabar text-white rounded-lg font-semibold hover:bg-cinnabar-dark active:scale-[0.98] transition-all"
          >
            继续
          </button>
        </div>
      )}
    </div>
  );
}
