import type { QueueItem, Quality } from '../models/types';
import ProgressBar from '../components/ProgressBar';
import TeachingCard from '../components/TeachingCard';
import QuizCard from '../components/QuizCard';
import TrueFalseCard from '../components/TrueFalseCard';

interface StudyPageProps {
  currentItem: QueueItem;
  currentIndex: number;
  queueLength: number;
  onAnswer: (quality: Quality) => void;
  onAdvanceTeaching: () => void;
  onEnd: () => void;
}

export default function StudyPage({
  currentItem, currentIndex, queueLength, onAnswer, onAdvanceTeaching, onEnd,
}: StudyPageProps) {
  const renderCard = () => {
    switch (currentItem.exerciseType) {
      case 'teaching':
        return <TeachingCard card={currentItem.card} onDone={onAdvanceTeaching} />;
      case 'quiz-forward':
        return <QuizCard card={currentItem.card} onAnswer={onAnswer} />;
      case 'true-false':
        return <TrueFalseCard card={currentItem.card} onAnswer={onAnswer} />;
      case 'quiz-reverse':
        return <QuizCard card={currentItem.card} reverse onAnswer={onAnswer} />;
    }
  };

  const badgeLabel = currentItem.isConsolidation ? '巩固'
    : currentItem.isRequeue ? '巩固'
    : currentItem.isNew ? '新卡'
    : '复习';

  const badgeColor = currentItem.isConsolidation || currentItem.isRequeue
    ? 'text-wrong' : currentItem.isNew ? 'text-cinnabar' : 'text-ink-muted';

  return (
    <div className="min-h-dvh bg-parchment flex flex-col">
      <ProgressBar currentIndex={currentIndex} queueLength={queueLength} />
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-xs text-ink-muted">
          <span className={badgeColor}>{badgeLabel}</span>
        </div>
        <button onClick={onEnd}
          className="text-sm text-cinnabar border border-cinnabar/30 bg-cinnabar/5 rounded-md px-3 py-1 hover:bg-cinnabar/10 active:scale-95 transition-all">
          ✕ 结束
        </button>
      </div>
      <div className="flex-1 flex items-start justify-center px-4 pt-4 pb-8">
        <div className="w-full max-w-md">{renderCard()}</div>
      </div>
    </div>
  );
}
