import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Card, CardState } from '../models/types';

// --- Mocks ---
vi.mock('./cardGenerator', () => ({
  getAllCards: vi.fn(() => []),
}));
vi.mock('../storage/localStorage', () => ({
  loadStudyRecord: vi.fn(() => ({ schemaVersion: 1, cardStates: {}, totalReviews: 0, lastStudyDate: '' })),
  getCardState: vi.fn(() => undefined),
}));
vi.mock('../algorithm/sm2', () => ({
  getToday: vi.fn(() => '2026-03-12'),
  isDue: vi.fn(() => false),
  hasBeenStudied: vi.fn(() => false),
}));
vi.mock('./exerciseAssigner', () => ({
  assignExerciseType: vi.fn(() => 'quiz-forward'),
}));

import { buildStudyQueue, insertConsolidation, requeueFailedCard, getHexagramMastery, getProgressInfo, getNextDueInfo } from './studyQueue';
import { getAllCards } from './cardGenerator';
import { loadStudyRecord, getCardState } from '../storage/localStorage';
import { getToday, isDue, hasBeenStudied } from '../algorithm/sm2';
import { assignExerciseType } from './exerciseAssigner';

const mockGetAllCards = getAllCards as ReturnType<typeof vi.fn>;
const mockLoadRecord = loadStudyRecord as ReturnType<typeof vi.fn>;
const mockGetCardState = getCardState as ReturnType<typeof vi.fn>;
const mockIsDue = isDue as ReturnType<typeof vi.fn>;
const mockHasBeenStudied = hasBeenStudied as ReturnType<typeof vi.fn>;
const mockAssignExercise = assignExerciseType as ReturnType<typeof vi.fn>;
const mockGetToday = getToday as ReturnType<typeof vi.fn>;

function makeCard(hexId: number, type: 'A' | 'C' | 'G'): Card {
  return { id: `${hexId}-${type}`, type, hexagramId: hexId, front: `f-${hexId}-${type}`, back: `b-${hexId}-${type}` };
}

function makeState(cardId: string, overrides: Partial<CardState> = {}): CardState {
  return {
    cardId,
    easeFactor: 2.5,
    interval: 6,
    repetitions: 2,
    dueDate: '2026-03-12',
    lastReviewDate: '2026-03-06',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetToday.mockReturnValue('2026-03-12');
});

// ─── buildStudyQueue ───

describe('buildStudyQueue', () => {
  it('returns empty queue when no cards exist', () => {
    mockGetAllCards.mockReturnValue([]);
    mockLoadRecord.mockReturnValue({ schemaVersion: 1, cardStates: {}, totalReviews: 0, lastStudyDate: '' });
    expect(buildStudyQueue()).toEqual([]);
  });

  it('puts all-new cards into Phase 2 with teaching + quiz-forward', () => {
    const cards = [makeCard(1, 'A'), makeCard(1, 'C'), makeCard(1, 'G')];
    mockGetAllCards.mockReturnValue(cards);
    mockLoadRecord.mockReturnValue({ schemaVersion: 1, cardStates: {}, totalReviews: 0, lastStudyDate: '' });
    mockHasBeenStudied.mockReturnValue(false);

    const queue = buildStudyQueue();

    // One teaching card per hexagram + one quiz-forward per card
    expect(queue).toHaveLength(4); // 1 teaching + 3 quiz-forward
    expect(queue[0].exerciseType).toBe('teaching');
    expect(queue[0].isNew).toBe(true);
    expect(queue.filter(q => q.exerciseType === 'quiz-forward')).toHaveLength(3);
  });

  it('deduplicates teaching cards and interleaves across hexagrams', () => {
    const cards = [makeCard(1, 'A'), makeCard(1, 'C'), makeCard(2, 'A'), makeCard(2, 'C')];
    mockGetAllCards.mockReturnValue(cards);
    mockLoadRecord.mockReturnValue({ schemaVersion: 1, cardStates: {}, totalReviews: 0, lastStudyDate: '' });
    mockHasBeenStudied.mockReturnValue(false);

    const queue = buildStudyQueue();
    const teachingItems = queue.filter(q => q.exerciseType === 'teaching');
    expect(teachingItems).toHaveLength(2); // one per hexagram

    // Round 0: teaching hex1, teaching hex2 (interleaved)
    expect(queue[0].exerciseType).toBe('teaching');
    expect(queue[0].card.hexagramId).toBe(1);
    expect(queue[1].exerciseType).toBe('teaching');
    expect(queue[1].card.hexagramId).toBe(2);
    // Round 1: quiz hex1-A, quiz hex2-A
    expect(queue[2].exerciseType).toBe('quiz-forward');
    expect(queue[2].card.hexagramId).toBe(1);
    expect(queue[3].exerciseType).toBe('quiz-forward');
    expect(queue[3].card.hexagramId).toBe(2);
  });

  it('puts due review cards in Phase 1 before new cards', () => {
    const dueCard = makeCard(1, 'A');
    const newCard = makeCard(2, 'A');
    mockGetAllCards.mockReturnValue([dueCard, newCard]);

    const dueState = makeState('1-A');
    mockLoadRecord.mockReturnValue({
      schemaVersion: 1,
      cardStates: { '1-A': dueState },
      totalReviews: 5,
      lastStudyDate: '2026-03-11',
    });
    mockHasBeenStudied.mockImplementation((s: CardState) => s.lastReviewDate !== '');
    mockIsDue.mockImplementation((s: CardState) => s.dueDate <= '2026-03-12');
    mockAssignExercise.mockReturnValue('true-false');

    const queue = buildStudyQueue();
    // Phase 1: 1 due review card; Phase 2: 1 teaching + 1 quiz-forward
    expect(queue).toHaveLength(3);
    expect(queue[0].isNew).toBe(false);
    expect(queue[0].exerciseType).toBe('true-false');
    expect(queue[1].exerciseType).toBe('teaching');
    expect(queue[2].exerciseType).toBe('quiz-forward');
  });

  it('does not include studied but not-due cards', () => {
    const card = makeCard(1, 'A');
    const futureState = makeState('1-A', { dueDate: '2026-03-20' });
    mockGetAllCards.mockReturnValue([card]);
    mockLoadRecord.mockReturnValue({
      schemaVersion: 1,
      cardStates: { '1-A': futureState },
      totalReviews: 3,
      lastStudyDate: '2026-03-10',
    });
    mockHasBeenStudied.mockReturnValue(true);
    mockIsDue.mockReturnValue(false);

    const queue = buildStudyQueue();
    expect(queue).toHaveLength(0);
  });
});

// ─── insertConsolidation ───

describe('insertConsolidation', () => {
  it('inserts a reverse quiz consolidation item', () => {
    const card = makeCard(1, 'A');
    const queue = Array.from({ length: 10 }, (_, i) => ({
      card: makeCard(i + 2, 'A'),
      exerciseType: 'quiz-forward' as const,
      isNew: true,
      isRequeue: false,
      isConsolidation: false,
    }));

    vi.spyOn(Math, 'random').mockReturnValue(0); // offset = 3
    const result = insertConsolidation(queue, 0, card);
    vi.restoreAllMocks();

    expect(result).toHaveLength(11);
    expect(result[3].card.id).toBe('1-A');
    expect(result[3].exerciseType).toBe('quiz-reverse');
    expect(result[3].isConsolidation).toBe(true);
    expect(result[3].isNew).toBe(false);
  });

  it('clamps insertion at end of queue', () => {
    const card = makeCard(1, 'A');
    const queue = [
      { card: makeCard(2, 'A'), exerciseType: 'quiz-forward' as const, isNew: true, isRequeue: false, isConsolidation: false },
    ];

    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const result = insertConsolidation(queue, 0, card);
    vi.restoreAllMocks();

    expect(result).toHaveLength(2);
    expect(result[result.length - 1].card.id).toBe('1-A');
  });

  it('does not mutate original queue', () => {
    const card = makeCard(1, 'A');
    const queue = [
      { card: makeCard(2, 'A'), exerciseType: 'quiz-forward' as const, isNew: true, isRequeue: false, isConsolidation: false },
    ];
    const original = [...queue];
    insertConsolidation(queue, 0, card);
    expect(queue).toEqual(original);
  });
});

// ─── requeueFailedCard ───

describe('requeueFailedCard', () => {
  it('inserts a forward quiz requeue item', () => {
    const card = makeCard(1, 'A');
    const queue = Array.from({ length: 10 }, (_, i) => ({
      card: makeCard(i + 2, 'A'),
      exerciseType: 'teaching' as const,
      isNew: true,
      isRequeue: false,
      isConsolidation: false,
    }));

    vi.spyOn(Math, 'random').mockReturnValue(0); // offset = 3
    const result = requeueFailedCard(queue, 0, card);
    vi.restoreAllMocks();

    expect(result).toHaveLength(11);
    expect(result[3].card.id).toBe('1-A');
    expect(result[3].exerciseType).toBe('quiz-forward');
    expect(result[3].isRequeue).toBe(true);
    expect(result[3].isConsolidation).toBe(false);
  });
});

// ─── getHexagramMastery ───

describe('getHexagramMastery', () => {
  it('returns unlearned when no card states exist', () => {
    mockGetCardState.mockReturnValue(undefined);
    expect(getHexagramMastery(1)).toBe('unlearned');
  });

  it('returns unlearned when all lastReviewDate are empty', () => {
    mockGetCardState.mockReturnValue(makeState('x', { lastReviewDate: '' }));
    expect(getHexagramMastery(1)).toBe('unlearned');
  });

  it('returns learning when some cards are studied but not all mastered', () => {
    mockGetCardState.mockImplementation((id: string) => {
      if (id === '1-A') return makeState('1-A', { repetitions: 5, lastReviewDate: '2026-03-10' });
      if (id === '1-C') return makeState('1-C', { repetitions: 2, lastReviewDate: '2026-03-10' });
      return makeState('1-G', { repetitions: 1, lastReviewDate: '2026-03-10' });
    });
    expect(getHexagramMastery(1)).toBe('learning');
  });

  it('returns mastered when all 3 card types have reps >= threshold', () => {
    mockGetCardState.mockReturnValue(makeState('x', { repetitions: 5, lastReviewDate: '2026-03-10' }));
    expect(getHexagramMastery(1)).toBe('mastered');
  });
});

// ─── getProgressInfo ───

describe('getProgressInfo', () => {
  it('returns correct counts', () => {
    const cards = [makeCard(1, 'A'), makeCard(1, 'C')];
    mockGetAllCards.mockReturnValue(cards);
    mockLoadRecord.mockReturnValue({
      schemaVersion: 1,
      cardStates: {
        '1-A': makeState('1-A', { repetitions: 3, dueDate: '2026-03-12' }),
        '1-C': makeState('1-C', { repetitions: 1, dueDate: '2026-03-20' }),
      },
      totalReviews: 10,
      lastStudyDate: '2026-03-11',
    });
    mockHasBeenStudied.mockReturnValue(true);

    const info = getProgressInfo(5);
    expect(info.totalHex).toBe(64);
    expect(info.studiedCards).toBeGreaterThan(0);
    expect(info.newLearnedCount).toBe(5);
  });

  it('returns zero counts for no studied cards', () => {
    mockGetAllCards.mockReturnValue([makeCard(1, 'A')]);
    mockLoadRecord.mockReturnValue({ schemaVersion: 1, cardStates: {}, totalReviews: 0, lastStudyDate: '' });
    mockHasBeenStudied.mockReturnValue(false);
    mockGetCardState.mockReturnValue(undefined);

    const info = getProgressInfo(0);
    expect(info.masteredHex).toBe(0);
    expect(info.studiedCards).toBe(0);
  });
});

// ─── getNextDueInfo ───

describe('getNextDueInfo', () => {
  it('returns null when no future due dates', () => {
    mockGetAllCards.mockReturnValue([makeCard(1, 'A')]);
    mockLoadRecord.mockReturnValue({
      schemaVersion: 1,
      cardStates: { '1-A': makeState('1-A', { dueDate: '2026-03-12' }) },
      totalReviews: 1,
      lastStudyDate: '2026-03-11',
    });
    mockHasBeenStudied.mockReturnValue(true);

    expect(getNextDueInfo()).toBeNull();
  });

  it('returns earliest future date with count', () => {
    const cards = [makeCard(1, 'A'), makeCard(1, 'C'), makeCard(2, 'A')];
    mockGetAllCards.mockReturnValue(cards);
    mockLoadRecord.mockReturnValue({
      schemaVersion: 1,
      cardStates: {
        '1-A': makeState('1-A', { dueDate: '2026-03-15' }),
        '1-C': makeState('1-C', { dueDate: '2026-03-15' }),
        '2-A': makeState('2-A', { dueDate: '2026-03-20' }),
      },
      totalReviews: 5,
      lastStudyDate: '2026-03-11',
    });
    mockHasBeenStudied.mockReturnValue(true);

    const info = getNextDueInfo()!;
    expect(info.date).toBe('2026-03-15');
    expect(info.count).toBe(2);
  });
});
