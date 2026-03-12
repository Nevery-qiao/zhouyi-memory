import type { Card, QueueItem, MasteryLevel } from '../models/types';
import { getAllCards } from './cardGenerator';
import { loadStudyRecord, getCardState } from '../storage/localStorage';
import { getToday, isDue, hasBeenStudied } from '../algorithm/sm2';
import { assignExerciseType } from './exerciseAssigner';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MASTERY_THRESHOLD = 4;

/**
 * Build study session queue with exercise types pre-assigned.
 *
 * Phase 1: Due review cards (shuffled, exercise type by mastery)
 * Phase 2: New cards (teaching → quiz-forward, interleaved by hexagram)
 */
export function buildStudyQueue(): QueueItem[] {
  const allCards = getAllCards();
  const record = loadStudyRecord();

  // --- Phase 1: Due review cards ---
  const dueItems: QueueItem[] = [];
  for (const card of allCards) {
    const state = record.cardStates[card.id];
    if (state && hasBeenStudied(state) && isDue(state)) {
      dueItems.push({
        card,
        exerciseType: assignExerciseType(state),
        isNew: false,
        isRequeue: false,
        isConsolidation: false,
      });
    }
  }
  const shuffledDue = shuffle(dueItems);

  // --- Phase 2: New cards with teaching flow ---
  const newItems: QueueItem[] = [];
  const taughtHexagrams = new Set<number>();

  for (const card of allCards) {
    const state = record.cardStates[card.id];
    if (!state || !hasBeenStudied(state)) {
      // Insert teaching card for this hexagram (once per hexagram)
      if (!taughtHexagrams.has(card.hexagramId)) {
        taughtHexagrams.add(card.hexagramId);
        newItems.push({
          card,
          exerciseType: 'teaching',
          isNew: true,
          isRequeue: false,
          isConsolidation: false,
        });
      }
      // Immediate test (forward quiz)
      newItems.push({
        card,
        exerciseType: 'quiz-forward',
        isNew: true,
        isRequeue: false,
        isConsolidation: false,
      });
    }
  }

  return [...shuffledDue, ...newItems];
}

/**
 * Insert a consolidation card (reverse quiz) 3-5 items after currentIndex.
 * Called when a new card's immediate test is answered correctly.
 */
export function insertConsolidation(
  queue: QueueItem[],
  currentIndex: number,
  card: Card,
): QueueItem[] {
  const newQueue = [...queue];
  const offset = 3 + Math.floor(Math.random() * 3);
  const insertAt = Math.min(currentIndex + offset, newQueue.length);
  newQueue.splice(insertAt, 0, {
    card,
    exerciseType: 'quiz-reverse',
    isNew: false,
    isRequeue: false,
    isConsolidation: true,
  });
  return newQueue;
}

/**
 * Requeue a failed card (forward quiz) 3-5 items after currentIndex.
 */
export function requeueFailedCard(
  queue: QueueItem[],
  currentIndex: number,
  card: Card,
): QueueItem[] {
  const newQueue = [...queue];
  const offset = 3 + Math.floor(Math.random() * 3);
  const insertAt = Math.min(currentIndex + offset, newQueue.length);
  newQueue.splice(insertAt, 0, {
    card,
    exerciseType: 'quiz-forward',
    isNew: false,
    isRequeue: true,
    isConsolidation: false,
  });
  return newQueue;
}

/**
 * Hexagram-level mastery for the dictionary page.
 */
export function getHexagramMastery(hexId: number): MasteryLevel {
  const states = (['A', 'C', 'G'] as const).map(t => getCardState(`${hexId}-${t}`));
  const hasAnyStudied = states.some(s => s && s.lastReviewDate !== '');
  if (!hasAnyStudied) return 'unlearned';
  const allMastered = states.every(s => s && s.repetitions >= MASTERY_THRESHOLD);
  if (allMastered) return 'mastered';
  return 'learning';
}

/**
 * Calculate global progress info.
 */
export function getProgressInfo(newLearnedCount: number) {
  const allCards = getAllCards();
  const record = loadStudyRecord();
  const today = getToday();

  let masteredCount = 0;
  let dueCount = 0;

  for (const card of allCards) {
    const state = record.cardStates[card.id];
    if (state && hasBeenStudied(state)) {
      if (state.repetitions >= 1) masteredCount++;
      if (state.dueDate <= today) dueCount++;
    }
  }

  return { masteredCount, totalCards: allCards.length, dueCount, newLearnedCount };
}

/**
 * Get next due review date and count (for summary page).
 */
export function getNextDueInfo(): { date: string; count: number } | null {
  const allCards = getAllCards();
  const record = loadStudyRecord();
  const today = getToday();

  const futureDates: string[] = [];
  for (const card of allCards) {
    const state = record.cardStates[card.id];
    if (state && hasBeenStudied(state) && state.dueDate > today) {
      futureDates.push(state.dueDate);
    }
  }

  if (futureDates.length === 0) return null;
  futureDates.sort();
  const nextDate = futureDates[0];
  const count = futureDates.filter(d => d === nextDate).length;
  return { date: nextDate, count };
}
