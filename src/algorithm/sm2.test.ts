import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { updateCardState, createInitialCardState, addDays, isDue } from './sm2';
import type { CardState } from '../models/types';

// Freeze time so getToday() always returns '2026-02-18'
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-02-18T12:00:00'));
});

afterEach(() => {
  vi.useRealTimers();
});

function makeState(overrides: Partial<CardState> = {}): CardState {
  return {
    cardId: '1-A',
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: '2026-02-18',
    lastReviewDate: '',
    ...overrides,
  };
}

describe('SM-2 Algorithm', () => {
  describe('createInitialCardState', () => {
    it('creates state with default values', () => {
      const state = createInitialCardState('1-A');
      expect(state.cardId).toBe('1-A');
      expect(state.easeFactor).toBe(2.5);
      expect(state.interval).toBe(0);
      expect(state.repetitions).toBe(0);
      expect(state.lastReviewDate).toBe('');
    });
  });

  describe('addDays', () => {
    it('adds days correctly', () => {
      expect(addDays('2026-02-18', 1)).toBe('2026-02-19');
      expect(addDays('2026-02-18', 6)).toBe('2026-02-24');
      expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
      expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    });
  });

  describe('quality < 3 (答错)', () => {
    it('resets repetitions to 0 and interval to 1 on quality=1', () => {
      const state = makeState({ repetitions: 5, interval: 30, easeFactor: 2.5 });
      const next = updateCardState(state, 1);
      expect(next.repetitions).toBe(0);
      expect(next.interval).toBe(1);
      expect(next.dueDate).toBe('2026-02-19'); // today + 1
    });

    it('does NOT reset easeFactor on failure', () => {
      const state = makeState({ easeFactor: 2.8, repetitions: 3, interval: 15 });
      const next = updateCardState(state, 1);
      // EF formula: 2.8 + (0.1 - (5-1) * (0.08 + (5-1) * 0.02))
      // = 2.8 + (0.1 - 4 * (0.08 + 0.08))
      // = 2.8 + (0.1 - 0.64)
      // = 2.8 - 0.54 = 2.26
      expect(next.easeFactor).toBeCloseTo(2.26, 2);
      expect(next.repetitions).toBe(0);
    });
  });

  describe('quality >= 3 (答对)', () => {
    it('first correct: interval = 1, repetitions = 1', () => {
      const state = makeState({ repetitions: 0, interval: 0 });
      const next = updateCardState(state, 3);
      expect(next.repetitions).toBe(1);
      expect(next.interval).toBe(1);
      expect(next.dueDate).toBe('2026-02-19');
    });

    it('second correct: interval = 6, repetitions = 2', () => {
      const state = makeState({ repetitions: 1, interval: 1 });
      const next = updateCardState(state, 4);
      expect(next.repetitions).toBe(2);
      expect(next.interval).toBe(6);
      expect(next.dueDate).toBe('2026-02-24');
    });

    it('third+ correct: interval = round(interval * EF)', () => {
      const state = makeState({ repetitions: 2, interval: 6, easeFactor: 2.5 });
      const next = updateCardState(state, 4);
      expect(next.repetitions).toBe(3);
      expect(next.interval).toBe(15); // round(6 * 2.5) = 15
    });

    it('quality=5 (很简单) increases easeFactor', () => {
      const state = makeState({ easeFactor: 2.5 });
      const next = updateCardState(state, 5);
      // EF: 2.5 + (0.1 - 0 * ...) = 2.5 + 0.1 = 2.6
      expect(next.easeFactor).toBeCloseTo(2.6, 2);
    });

    it('quality=3 (想起来了) decreases easeFactor', () => {
      const state = makeState({ easeFactor: 2.5 });
      const next = updateCardState(state, 3);
      // EF: 2.5 + (0.1 - 2 * (0.08 + 2*0.02))
      // = 2.5 + (0.1 - 2 * 0.12) = 2.5 + (0.1 - 0.24) = 2.5 - 0.14 = 2.36
      expect(next.easeFactor).toBeCloseTo(2.36, 2);
    });
  });

  describe('参数边界', () => {
    it('easeFactor never goes below 1.3', () => {
      const state = makeState({ easeFactor: 1.3 });
      const next = updateCardState(state, 1);
      expect(next.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('interval capped at 365 days', () => {
      const state = makeState({ repetitions: 10, interval: 300, easeFactor: 2.5 });
      const next = updateCardState(state, 5);
      expect(next.interval).toBeLessThanOrEqual(365);
    });

    it('interval at least 1 day', () => {
      const state = makeState({ repetitions: 0 });
      const next = updateCardState(state, 1);
      expect(next.interval).toBeGreaterThanOrEqual(1);
    });
  });

  describe('overdue cards (过期卡片)', () => {
    it('uses scheduled interval, not elapsed days, for calculation', () => {
      // Card was due with interval=6 but 25 days have passed
      const state = makeState({
        repetitions: 2,
        interval: 6, // scheduled interval
        easeFactor: 2.5,
        dueDate: '2026-01-24', // 25 days ago
        lastReviewDate: '2026-01-18',
      });
      const next = updateCardState(state, 4);
      // Should use interval=6, not 25
      // nextInterval = round(6 * EF) = round(6 * 2.5) = 15
      expect(next.interval).toBe(15);
      // NOT round(25 * 2.5) = 63
    });
  });

  describe('isDue', () => {
    it('returns true if dueDate <= today', () => {
      expect(isDue(makeState({ dueDate: '2026-02-18' }))).toBe(true);
      expect(isDue(makeState({ dueDate: '2026-02-17' }))).toBe(true);
    });

    it('returns false if dueDate > today', () => {
      expect(isDue(makeState({ dueDate: '2026-02-19' }))).toBe(false);
    });
  });

  describe('immutability', () => {
    it('does not modify the input state', () => {
      const state = makeState({ repetitions: 2, interval: 6, easeFactor: 2.5 });
      const original = { ...state };
      updateCardState(state, 4);
      expect(state).toEqual(original);
    });
  });
});
