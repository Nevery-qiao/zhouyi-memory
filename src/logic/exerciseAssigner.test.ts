import { describe, it, expect } from 'vitest';
import { assignExerciseType } from './exerciseAssigner';
import type { CardState } from '../models/types';

function makeState(reps: number): CardState {
  return {
    cardId: '1-A',
    easeFactor: 2.5,
    interval: 6,
    repetitions: reps,
    dueDate: '2026-03-12',
    lastReviewDate: '2026-03-06',
  };
}

describe('assignExerciseType', () => {
  it('returns quiz-forward for undefined cardState', () => {
    expect(assignExerciseType(undefined)).toBe('quiz-forward');
  });

  it('returns quiz-forward for repetitions 0', () => {
    expect(assignExerciseType(makeState(0))).toBe('quiz-forward');
  });

  it('returns quiz-forward for repetitions 1', () => {
    expect(assignExerciseType(makeState(1))).toBe('quiz-forward');
  });

  it('returns true-false for repetitions 2', () => {
    expect(assignExerciseType(makeState(2))).toBe('true-false');
  });

  it('returns true-false for repetitions 3', () => {
    expect(assignExerciseType(makeState(3))).toBe('true-false');
  });

  it('returns quiz-reverse for repetitions 4', () => {
    expect(assignExerciseType(makeState(4))).toBe('quiz-reverse');
  });

  it('returns quiz-reverse for repetitions 10', () => {
    expect(assignExerciseType(makeState(10))).toBe('quiz-reverse');
  });
});
