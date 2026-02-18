import type { QueueItem, Quality, StudyMode, ProgressInfo, QuizOption } from '../models/types';
import ProgressBar from '../components/ProgressBar';
import FlipCard from '../components/FlipCard';
import QuizCard from '../components/QuizCard';

interface StudyPageProps {
  currentItem: QueueItem;
  mode: StudyMode;
  progress: ProgressInfo;
  quizOptions: QuizOption[];
  onAnswer: (quality: Quality) => void;
  onEnd: () => void;
}

export default function StudyPage({ currentItem, mode, progress, quizOptions, onAnswer, onEnd }: StudyPageProps) {
  return (
    <div className="min-h-dvh bg-parchment flex flex-col">
      {/* 顶部进度 */}
      <ProgressBar progress={progress} />

      {/* 顶栏 */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-xs text-ink-muted">
          {currentItem.isNew && <span className="text-cinnabar">新卡</span>}
          {currentItem.isRequeue && <span className="text-wrong">巩固</span>}
          {!currentItem.isNew && !currentItem.isRequeue && <span>复习</span>}
          <span className="ml-2 text-ink-muted/50">
            {currentItem.card.type === 'A' && '卦象→卦名'}
            {currentItem.card.type === 'C' && '卦名→卦辞'}
            {currentItem.card.type === 'G' && '卦象→上下卦'}
          </span>
        </div>
        <button
          onClick={onEnd}
          className="text-xs text-ink-muted hover:text-ink transition-colors px-2 py-1"
        >
          结束学习
        </button>
      </div>

      {/* 卡片区域 */}
      <div className="flex-1 flex items-start justify-center px-4 pt-4 pb-8">
        <div className="w-full max-w-md">
          {mode === 'flip' ? (
            <FlipCard card={currentItem.card} onAnswer={onAnswer} />
          ) : (
            <QuizCard card={currentItem.card} options={quizOptions} onAnswer={onAnswer} />
          )}
        </div>
      </div>
    </div>
  );
}
