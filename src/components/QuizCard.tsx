import { useState, useEffect } from 'react';
import type { Card, Quality, QuizOption } from '../models/types';
import { generateQuizOptions, generateReverseQuizOptions } from '../logic/distractorPicker';

interface QuizCardProps {
  card: Card;
  reverse?: boolean;
  onAnswer: (quality: Quality) => void;
}

export default function QuizCard({ card, reverse = false, onAnswer }: QuizCardProps) {
  const [options, setOptions] = useState<QuizOption[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    const opts = reverse
      ? generateReverseQuizOptions(card)
      : generateQuizOptions(card);
    setOptions(opts);
    setSelected(null);
    setFadeKey(prev => prev + 1);
  }, [card.id, reverse]);

  const answered = selected !== null;
  const isCorrect = selected !== null && options[selected]?.isCorrect;

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelected(index);
  };

  const handleNext = () => {
    onAnswer(isCorrect ? 4 : 1);
  };

  const promptText = reverse ? card.back : card.front;
  const isSymbolPrompt = reverse
    ? false
    : (card.type === 'A' || card.type === 'G');

  const dimensionLabel = reverse
    ? { A: '哪个是它的卦象？', C: '这是哪一卦的卦辞？', G: '哪个是它的卦象？' }[card.type]
    : { A: '此为何卦？', C: '卦辞为何？', G: '上下卦为何？' }[card.type];

  return (
    <div key={fadeKey} className="card-fade-enter flex flex-col items-center">
      {/* 题面 */}
      <div className="w-full bg-card-bg border border-card-border rounded-xl p-8 min-h-[160px] flex flex-col items-center justify-center mb-6">
        <div className="text-xs text-ink-muted mb-3">{dimensionLabel}</div>
        <div className={`${isSymbolPrompt ? 'hexagram-symbol text-7xl' : 'text-4xl font-bold'} text-ink`}>
          {promptText}
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

          const isSymbolOption = reverse
            ? (card.type === 'A' || card.type === 'G')
            : false;

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={answered}
              className={`w-full py-3 px-4 rounded-lg border text-left text-sm transition-all ${style} ${
                !answered ? 'active:scale-[0.98] cursor-pointer' : 'cursor-default'
              }`}
            >
              <span className={`${isSymbolOption ? 'hexagram-symbol text-xl' : ''} ${card.type === 'C' && !reverse ? 'line-clamp-2' : ''}`}>
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
