import { useState, useCallback, useMemo } from 'react';
import type { QueueItem, Quality, SessionStats, ProgressInfo } from '../models/types';
import { updateCardState, createInitialCardState } from '../algorithm/sm2';
import { saveCardState, getCardState } from '../storage/localStorage';
import {
  buildStudyQueue, requeueFailedCard, insertConsolidation,
  getProgressInfo, getNextDueInfo,
} from '../logic/studyQueue';

const NEW_CARD_SOFT_LIMIT = 5;

export type SessionPhase = 'idle' | 'studying' | 'newCardPrompt' | 'summary' | 'allDone';

export function useStudySession() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [stats, setStats] = useState<SessionStats>({
    reviewedCount: 0, newCount: 0, correctCount: 0, totalAnswered: 0,
  });
  const [newCardCount, setNewCardCount] = useState(0);

  const startSession = useCallback(() => {
    const q = buildStudyQueue();
    setQueue(q);
    setCurrentIndex(0);
    setStats({ reviewedCount: 0, newCount: 0, correctCount: 0, totalAnswered: 0 });
    setNewCardCount(0);
    setPhase(q.length > 0 ? 'studying' : 'allDone');
  }, []);

  const currentItem = useMemo(() => {
    if (currentIndex < queue.length) return queue[currentIndex];
    return null;
  }, [queue, currentIndex]);

  const progress = useMemo((): ProgressInfo => {
    return getProgressInfo(stats.newCount);
  }, [stats.newCount]);

  /** Advance past teaching card — no scoring, just move forward */
  const advanceTeaching = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      setPhase('summary');
    } else {
      setCurrentIndex(nextIndex);
    }
  }, [queue, currentIndex]);

  /** Answer a scored exercise (quiz-forward, true-false, quiz-reverse) */
  const answerCard = useCallback((quality: Quality) => {
    const item = queue[currentIndex];
    if (!item) return;

    const isCorrect = quality >= 3;
    const shouldUpdateSM2 = !item.isRequeue && !item.isConsolidation;

    // Update stats
    setStats(prev => {
      const next = { ...prev, totalAnswered: prev.totalAnswered + 1 };
      if (isCorrect) next.correctCount++;
      if (item.isNew && !item.isRequeue) next.newCount++;
      else if (!item.isNew && !item.isRequeue && !item.isConsolidation) next.reviewedCount++;
      return next;
    });

    // Update SM-2 (only for non-requeue, non-consolidation)
    if (shouldUpdateSM2) {
      const existing = getCardState(item.card.id);
      const state = existing || createInitialCardState(item.card.id);
      const updated = updateCardState(state, quality);
      saveCardState(updated);
    }

    // Answer wrong → requeue
    if (!isCorrect && !item.isRequeue && !item.isConsolidation) {
      setQueue(prev => requeueFailedCard(prev, currentIndex, item.card));
    }

    // New card answered correctly → insert consolidation
    if (isCorrect && item.isNew && !item.isRequeue) {
      setQueue(prev => insertConsolidation(prev, currentIndex, item.card));
    }

    // Track new card count for soft limit
    let nextNewCardCount = newCardCount;
    if (item.isNew && !item.isRequeue) {
      nextNewCardCount = newCardCount + 1;
      setNewCardCount(nextNewCardCount);
    }

    // Advance
    const nextIndex = currentIndex + 1;

    // Check new card soft limit
    if (nextNewCardCount > 0 && nextNewCardCount % NEW_CARD_SOFT_LIMIT === 0 && item.isNew) {
      const nextItem = queue[nextIndex];
      if (nextItem && nextItem.isNew) {
        setCurrentIndex(nextIndex);
        setPhase('newCardPrompt');
        return;
      }
    }

    if (nextIndex >= queue.length) {
      setPhase('summary');
    } else {
      setCurrentIndex(nextIndex);
    }
  }, [queue, currentIndex, newCardCount]);

  const continueAfterPrompt = useCallback(() => { setPhase('studying'); }, []);
  const endSession = useCallback(() => { setPhase('summary'); }, []);
  const goHome = useCallback(() => { setPhase('idle'); }, []);

  const nextDueInfo = useMemo(() => {
    if (phase === 'summary' || phase === 'allDone') return getNextDueInfo();
    return null;
  }, [phase]);

  return {
    phase, currentItem, progress, stats, nextDueInfo,
    startSession, advanceTeaching, answerCard,
    continueAfterPrompt, endSession, goHome,
  };
}
