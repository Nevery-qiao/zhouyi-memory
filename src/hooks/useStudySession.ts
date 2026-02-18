import { useState, useCallback, useMemo } from 'react';
import type { QueueItem, Quality, SessionStats, StudyMode, ProgressInfo } from '../models/types';
import { updateCardState, createInitialCardState } from '../algorithm/sm2';
import { saveCardState, getCardState } from '../storage/localStorage';
import { buildStudyQueue, requeueFailedCard, getProgressInfo, getNextDueInfo } from '../logic/studyQueue';
import { generateQuizOptions } from '../logic/distractorPicker';

const NEW_CARD_SOFT_LIMIT = 5;

export type SessionPhase = 'idle' | 'studying' | 'newCardPrompt' | 'summary' | 'allDone';

export function useStudySession() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<StudyMode>('flip');
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [stats, setStats] = useState<SessionStats>({
    reviewedCount: 0,
    newCount: 0,
    correctCount: 0,
    totalAnswered: 0,
  });
  const [newCardCount, setNewCardCount] = useState(0);

  /** 开始新的学习 session */
  const startSession = useCallback(() => {
    const q = buildStudyQueue();
    setQueue(q);
    setCurrentIndex(0);
    setStats({ reviewedCount: 0, newCount: 0, correctCount: 0, totalAnswered: 0 });
    setNewCardCount(0);
    setPhase(q.length > 0 ? 'studying' : 'allDone');
  }, []);

  /** 当前卡片 */
  const currentItem = useMemo(() => {
    if (currentIndex < queue.length) return queue[currentIndex];
    return null;
  }, [queue, currentIndex]);

  /** 当前卡片的四选一选项 */
  const quizOptions = useMemo(() => {
    if (!currentItem) return [];
    return generateQuizOptions(currentItem.card);
  }, [currentItem]);

  /** 获取进度信息 */
  const progress = useMemo((): ProgressInfo => {
    return getProgressInfo(stats.newCount);
  }, [stats.newCount]);

  /** 回答当前卡片 */
  const answerCard = useCallback((quality: Quality) => {
    const item = queue[currentIndex];
    if (!item) return;

    // 更新统计
    setStats(prev => {
      const next = { ...prev };
      if (item.isNew) next.newCount++;
      else if (!item.isRequeue) next.reviewedCount++;
      if (mode === 'quiz') {
        next.totalAnswered++;
        if (quality >= 3) next.correctCount++;
      }
      return next;
    });

    // 更新 SM-2 状态并保存（仅非重排卡）
    if (!item.isRequeue) {
      const existing = getCardState(item.card.id);
      const state = existing || createInitialCardState(item.card.id);
      const updated = updateCardState(state, quality);
      saveCardState(updated);
    }

    // 答错 → 重排到队列尾部
    if (quality < 3 && !item.isRequeue) {
      setQueue(prev => requeueFailedCard(prev, currentIndex, item.card));
    }

    // 跟踪新卡数量
    let nextNewCardCount = newCardCount;
    if (item.isNew) {
      nextNewCardCount = newCardCount + 1;
      setNewCardCount(nextNewCardCount);
    }

    // 前进到下一张
    const nextIndex = currentIndex + 1;

    // 检查是否到达新卡软限制
    if (nextNewCardCount > 0 && nextNewCardCount % NEW_CARD_SOFT_LIMIT === 0 && item.isNew) {
      // 检查下一张是否也是新卡（如果是，弹出提示）
      const nextItem = queue[nextIndex];
      if (nextItem && nextItem.isNew) {
        setCurrentIndex(nextIndex);
        setPhase('newCardPrompt');
        return;
      }
    }

    // 检查是否完成
    if (nextIndex >= queue.length) {
      setPhase('summary');
    } else {
      setCurrentIndex(nextIndex);
    }
  }, [queue, currentIndex, mode, newCardCount]);

  /** 新卡提示后继续学习 */
  const continueAfterPrompt = useCallback(() => {
    setPhase('studying');
  }, []);

  /** 结束学习 session */
  const endSession = useCallback(() => {
    setPhase('summary');
  }, []);

  /** 返回首页 */
  const goHome = useCallback(() => {
    setPhase('idle');
  }, []);

  /** 下次到期信息 */
  const nextDueInfo = useMemo(() => {
    if (phase === 'summary' || phase === 'allDone') {
      return getNextDueInfo();
    }
    return null;
  }, [phase]);

  return {
    phase,
    mode,
    setMode,
    currentItem,
    quizOptions,
    progress,
    stats,
    nextDueInfo,
    startSession,
    answerCard,
    continueAfterPrompt,
    endSession,
    goHome,
  };
}
