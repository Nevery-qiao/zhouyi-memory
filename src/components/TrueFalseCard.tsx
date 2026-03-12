import { useState, useEffect } from 'react';
import type { Card, Quality, TrueFalseQuestion } from '../models/types';
import { generateTrueFalse } from '../logic/trueFalseGenerator';

interface TrueFalseCardProps {
  card: Card;
  onAnswer: (quality: Quality) => void;
}

export default function TrueFalseCard({ card, onAnswer }: TrueFalseCardProps) {
  const [question, setQuestion] = useState<TrueFalseQuestion>(() => generateTrueFalse(card));
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    setQuestion(generateTrueFalse(card));
    setAnswered(null);
    setFadeKey(prev => prev + 1);
  }, [card.id]);

  const isSymbol = card.type === 'A' || card.type === 'G';
  const userCorrect = answered !== null && answered === question.isCorrect;

  const handleAnswer = (userSaysTrue: boolean) => {
    if (answered !== null) return;
    setAnswered(userSaysTrue);
  };

  const handleNext = () => {
    onAnswer(userCorrect ? 4 : 1);
  };

  return (
    <div key={fadeKey} className="card-fade-enter flex flex-col items-center">
      {/* Question */}
      <div className="w-full bg-card-bg border border-card-border rounded-xl p-8 min-h-[200px] flex flex-col items-center justify-center mb-6">
        <div className="text-xs text-ink-muted mb-4">{question.dimension}</div>
        <div className={`${isSymbol ? 'hexagram-symbol text-7xl' : 'text-4xl font-bold'} text-ink mb-4`}>
          {question.front}
        </div>
        <div className="text-2xl text-ink-light">
          = {question.claim} ？
        </div>
      </div>

      {/* Answer buttons */}
      {answered === null ? (
        <div className="w-full grid grid-cols-2 gap-4">
          <button
            onClick={() => handleAnswer(false)}
            className="py-3.5 rounded-lg border border-wrong/30 bg-wrong/5 text-wrong font-semibold hover:bg-wrong/10 active:scale-95 transition-all"
          >
            ✗ 错
          </button>
          <button
            onClick={() => handleAnswer(true)}
            className="py-3.5 rounded-lg border border-jade/30 bg-jade/5 text-jade font-semibold hover:bg-jade/10 active:scale-95 transition-all"
          >
            ✓ 对
          </button>
        </div>
      ) : (
        <div className="w-full card-fade-enter">
          <div className={`text-center text-sm mb-4 ${userCorrect ? 'text-jade' : 'text-wrong'}`}>
            {userCorrect ? '判断正确' : `判断错误 — 正确答案：${question.isCorrect ? '对' : '错'}`}
          </div>
          {!question.isCorrect && (
            <div className="text-center text-sm text-ink-muted mb-4">
              正确配对：{question.front} = {card.back}
            </div>
          )}
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
