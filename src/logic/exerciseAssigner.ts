import type { CardState, ExerciseType } from '../models/types';

/**
 * Assign exercise type based on card mastery level.
 * - Weak (rep 0-1): forward quiz (easiest)
 * - Medium (rep 2-3): true/false
 * - Strong (rep 4+): reverse quiz (hardest)
 */
export function assignExerciseType(cardState: CardState | undefined): ExerciseType {
  if (!cardState || cardState.repetitions <= 1) return 'quiz-forward';
  if (cardState.repetitions <= 3) return 'true-false';
  return 'quiz-reverse';
}
