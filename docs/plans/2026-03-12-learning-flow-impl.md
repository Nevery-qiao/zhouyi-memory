# Learning Flow Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the study session to use auto-mixed exercise types, a teach→test→consolidate flow for new cards, and a browsable hexagram dictionary page.

**Architecture:** Extend the existing type system with `ExerciseType` and richer `QueueItem`. Rewrite `buildStudyQueue` to produce a queue with exercise types pre-assigned. Add new UI components for teaching cards, true/false cards, and reverse quiz cards. Add a hexagram dictionary page. Remove FlipCard and mode selector.

**Tech Stack:** React 19 + TypeScript, Vite 7, Tailwind CSS 4, Vitest 4

---

### Task 1: Update Type Definitions

**Files:**
- Modify: `src/models/types.ts`

**Step 1: Update types**

Replace the content of `src/models/types.ts` with the following changes:

```typescript
// ADD: Exercise type enum
export type ExerciseType = 'teaching' | 'quiz-forward' | 'true-false' | 'quiz-reverse';

// ADD: judgmentTranslation to Hexagram
export interface Hexagram {
  id: number;
  name: string;
  symbol: string;
  trigram: string;
  judgment: string;
  judgmentTranslation: string;  // NEW
  upperTrigram: string;
  lowerTrigram: string;
  upperTrigramSymbol: string;
  lowerTrigramSymbol: string;
}

// REMOVE: StudyMode type (was 'flip' | 'quiz')
// REMOVE: FlipQuality type (was 1 | 3 | 5)

// CHANGE: Quality is now only quiz-based
export type Quality = 1 | 4;

// CHANGE: QueueItem gets exerciseType, replaces isNew boolean with richer info
export interface QueueItem {
  card: Card;
  exerciseType: ExerciseType;
  isNew: boolean;
  isRequeue: boolean;           // requeue after wrong answer, don't update SM-2
  isConsolidation: boolean;     // delayed consolidation after correct new card, don't update SM-2
}

// CHANGE: SessionStats - remove quiz-specific naming since all types are objective now
export interface SessionStats {
  reviewedCount: number;
  newCount: number;
  correctCount: number;
  totalAnswered: number;
}

// ADD: Hexagram mastery for dictionary page
export type MasteryLevel = 'unlearned' | 'learning' | 'mastered';

// ADD: True/false question data
export interface TrueFalseQuestion {
  front: string;          // e.g. hexagram symbol
  claim: string;          // e.g. hexagram name (may be wrong)
  isCorrect: boolean;     // whether the pairing is correct
  dimension: string;      // display label like "此为何卦？"
}

// Keep unchanged: Card, CardType, CardState, StudyRecord, QuizOption, ProgressInfo
```

**Step 2: Verify build**

Run: `cd /Users/qiaoyang/Projects/zhouyi-memory && npx tsc --noEmit 2>&1 | head -30`

Expected: Type errors in files that reference removed types (`StudyMode`, `FlipQuality`). This is expected — we fix them in later tasks.

**Step 3: Commit**

```bash
git add src/models/types.ts
git commit -m "refactor: update type definitions for mixed exercise types"
```

---

### Task 2: Add Judgment Translations to Hexagram Data

**Files:**
- Modify: `src/data/hexagrams.ts`

**Step 1: Add `judgmentTranslation` field to all 64 hexagrams**

Every hexagram entry needs a `judgmentTranslation` string. Example for the first few:

```typescript
{
  id: 1,
  name: '乾',
  symbol: '䷀',
  trigram: '☰',
  judgment: '元亨利贞。',
  judgmentTranslation: '大通顺利，利于坚守正道。',
  upperTrigram: '乾',
  lowerTrigram: '乾',
  upperTrigramSymbol: '☰',
  lowerTrigramSymbol: '☰',
},
{
  id: 2,
  name: '坤',
  symbol: '䷁',
  trigram: '☷',
  judgment: '元亨，利牝马之贞。君子有攸往，先迷后得主，利。西南得朋，东北丧朋。安贞吉。',
  judgmentTranslation: '大通顺利，利于像母马一样柔顺坚守。君子有所前往，先迷失后得到主人，有利。西南方得到朋友，东北方失去朋友。安于正道则吉祥。',
  // ... rest unchanged
},
```

Add accurate translations for all 64 hexagrams. Use authoritative 周易 translations (白话文). Each translation should be concise (1-3 sentences).

**Step 2: Verify data completeness**

Run: `cd /Users/qiaoyang/Projects/zhouyi-memory && npx tsx -e "import {hexagrams} from './src/data/hexagrams'; console.log('count:', hexagrams.length); const missing = hexagrams.filter(h => !h.judgmentTranslation); console.log('missing translations:', missing.length)"`

Expected: `count: 64`, `missing translations: 0`

**Step 3: Commit**

```bash
git add src/data/hexagrams.ts
git commit -m "data: add judgment translations for all 64 hexagrams"
```

---

### Task 3: Exercise Type Assignment Logic

**Files:**
- Create: `src/logic/exerciseAssigner.ts`
- Create: `src/logic/exerciseAssigner.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/logic/exerciseAssigner.test.ts
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
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/qiaoyang/Projects/zhouyi-memory && npx vitest run src/logic/exerciseAssigner.test.ts 2>&1`

Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/logic/exerciseAssigner.ts
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
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/qiaoyang/Projects/zhouyi-memory && npx vitest run src/logic/exerciseAssigner.test.ts 2>&1`

Expected: All 7 tests PASS

**Step 5: Commit**

```bash
git add src/logic/exerciseAssigner.ts src/logic/exerciseAssigner.test.ts
git commit -m "feat: add exercise type assignment logic with tests"
```

---

### Task 4: True/False Question Generator

**Files:**
- Create: `src/logic/trueFalseGenerator.ts`
- Create: `src/logic/trueFalseGenerator.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/logic/trueFalseGenerator.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateTrueFalse } from './trueFalseGenerator';
import type { Card } from '../models/types';

const cardA: Card = { id: '1-A', type: 'A', hexagramId: 1, front: '☰', back: '乾' };
const cardC: Card = { id: '1-C', type: 'C', hexagramId: 1, front: '乾', back: '元亨利贞。' };
const cardG: Card = { id: '1-G', type: 'G', hexagramId: 1, front: '䷀', back: '上乾☰ 下乾☰' };

describe('generateTrueFalse', () => {
  it('returns an object with front, claim, isCorrect, dimension', () => {
    const q = generateTrueFalse(cardA);
    expect(q).toHaveProperty('front');
    expect(q).toHaveProperty('claim');
    expect(q).toHaveProperty('isCorrect');
    expect(q).toHaveProperty('dimension');
    expect(typeof q.isCorrect).toBe('boolean');
  });

  it('when isCorrect=true, claim equals card.back', () => {
    // Force Math.random to return < 0.5 (isCorrect = true)
    vi.spyOn(Math, 'random').mockReturnValue(0.3);
    const q = generateTrueFalse(cardA);
    expect(q.isCorrect).toBe(true);
    expect(q.claim).toBe('乾');
    vi.restoreAllMocks();
  });

  it('when isCorrect=false, claim differs from card.back', () => {
    // Force Math.random to return >= 0.5 (isCorrect = false)
    vi.spyOn(Math, 'random').mockReturnValue(0.7);
    const q = generateTrueFalse(cardA);
    expect(q.isCorrect).toBe(false);
    expect(q.claim).not.toBe('乾');
    vi.restoreAllMocks();
  });

  it('works for card type C', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.3);
    const q = generateTrueFalse(cardC);
    expect(q.front).toBe('乾');
    expect(q.isCorrect).toBe(true);
    vi.restoreAllMocks();
  });

  it('works for card type G', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.3);
    const q = generateTrueFalse(cardG);
    expect(q.front).toBe('䷀');
    expect(q.isCorrect).toBe(true);
    vi.restoreAllMocks();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/qiaoyang/Projects/zhouyi-memory && npx vitest run src/logic/trueFalseGenerator.test.ts 2>&1`

Expected: FAIL

**Step 3: Write implementation**

```typescript
// src/logic/trueFalseGenerator.ts
import type { Card, TrueFalseQuestion } from '../models/types';
import { hexagrams } from '../data/hexagrams';
import { getAllCards } from './cardGenerator';

const DIMENSION_LABELS: Record<string, string> = {
  A: '此为何卦？',
  C: '卦辞为何？',
  G: '上下卦为何？',
};

/**
 * Generate a true/false question for a card.
 * 50% chance correct pairing, 50% chance wrong pairing.
 */
export function generateTrueFalse(card: Card): TrueFalseQuestion {
  const isCorrect = Math.random() < 0.5;
  const dimension = DIMENSION_LABELS[card.type] || '';

  if (isCorrect) {
    return { front: card.front, claim: card.back, isCorrect: true, dimension };
  }

  const wrongAnswer = pickWrongAnswer(card);
  return { front: card.front, claim: wrongAnswer, isCorrect: false, dimension };
}

function pickWrongAnswer(card: Card): string {
  const allAnswers = getAllPossibleAnswers(card.type);
  const pool = allAnswers.filter(a => a !== card.back);
  // Pick a random wrong answer
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

function getAllPossibleAnswers(cardType: string): string[] {
  switch (cardType) {
    case 'A':
      return hexagrams.map(h => h.name);
    case 'C':
      return hexagrams.map(h => h.judgment);
    case 'G': {
      const allCards = getAllCards();
      return allCards.filter(c => c.type === 'G').map(c => c.back);
    }
    default:
      return [];
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/qiaoyang/Projects/zhouyi-memory && npx vitest run src/logic/trueFalseGenerator.test.ts 2>&1`

Expected: All 5 tests PASS

**Step 5: Commit**

```bash
git add src/logic/trueFalseGenerator.ts src/logic/trueFalseGenerator.test.ts
git commit -m "feat: add true/false question generator with tests"
```

---

### Task 5: Reverse Quiz Option Generator

**Files:**
- Modify: `src/logic/distractorPicker.ts`
- Create: `src/logic/distractorPicker.test.ts`

**Step 1: Write the failing tests for reverse quiz**

```typescript
// src/logic/distractorPicker.test.ts
import { describe, it, expect } from 'vitest';
import { generateQuizOptions, generateReverseQuizOptions } from './distractorPicker';
import type { Card } from '../models/types';

const cardA: Card = { id: '1-A', type: 'A', hexagramId: 1, front: '☰', back: '乾' };

describe('generateReverseQuizOptions', () => {
  it('returns 4 options', () => {
    const opts = generateReverseQuizOptions(cardA);
    expect(opts).toHaveLength(4);
  });

  it('has exactly one correct option', () => {
    const opts = generateReverseQuizOptions(cardA);
    const correct = opts.filter(o => o.isCorrect);
    expect(correct).toHaveLength(1);
  });

  it('correct option text is the card front (reversed)', () => {
    const opts = generateReverseQuizOptions(cardA);
    const correct = opts.find(o => o.isCorrect)!;
    expect(correct.text).toBe('☰'); // front becomes the answer in reverse
  });

  it('no duplicate option texts', () => {
    const opts = generateReverseQuizOptions(cardA);
    const texts = opts.map(o => o.text);
    expect(new Set(texts).size).toBe(4);
  });
});

describe('generateQuizOptions (existing)', () => {
  it('returns 4 options with one correct', () => {
    const opts = generateQuizOptions(cardA);
    expect(opts).toHaveLength(4);
    expect(opts.filter(o => o.isCorrect)).toHaveLength(1);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/qiaoyang/Projects/zhouyi-memory && npx vitest run src/logic/distractorPicker.test.ts 2>&1`

Expected: FAIL — `generateReverseQuizOptions` not found

**Step 3: Add `generateReverseQuizOptions` to `distractorPicker.ts`**

Add the following function to the existing file:

```typescript
/**
 * Generate reverse quiz options: given card.back as prompt,
 * pick card.front as correct + 3 wrong fronts from same card type.
 */
export function generateReverseQuizOptions(card: Card): QuizOption[] {
  const correctAnswer = card.front;
  const allFronts = getAllPossibleFronts(card.type);
  const pool = allFronts.filter(f => f !== correctAnswer);
  const distractors = pickRandom(pool, 3);

  const options: QuizOption[] = [
    { text: correctAnswer, isCorrect: true },
    ...distractors.map(text => ({ text, isCorrect: false })),
  ];

  return shuffleArray(options);
}

function getAllPossibleFronts(cardType: string): string[] {
  const allCards = getAllCards();
  return allCards.filter(c => c.type === cardType).map(c => c.front);
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/qiaoyang/Projects/zhouyi-memory && npx vitest run src/logic/distractorPicker.test.ts 2>&1`

Expected: All 5 tests PASS

**Step 5: Commit**

```bash
git add src/logic/distractorPicker.ts src/logic/distractorPicker.test.ts
git commit -m "feat: add reverse quiz option generator with tests"
```

---

### Task 6: Rewrite Study Queue Builder

**Files:**
- Modify: `src/logic/studyQueue.ts`
- Modify: `src/logic/studyQueue.ts` — update `buildStudyQueue` signature and logic

**Step 1: Write tests for new queue builder**

Create `src/logic/studyQueue.test.ts`:

```typescript
// src/logic/studyQueue.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildStudyQueue, getHexagramMastery } from './studyQueue';

// Mock localStorage to control card states
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-03-12T12:00:00'));
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('buildStudyQueue', () => {
  it('returns teaching + quiz-forward for new cards', () => {
    const queue = buildStudyQueue();
    // First items should be new cards (no stored state)
    // First new hexagram: teaching card, then quiz-forward
    const firstTeaching = queue.find(q => q.exerciseType === 'teaching');
    expect(firstTeaching).toBeDefined();
    expect(firstTeaching!.isNew).toBe(true);
  });

  it('does not duplicate teaching cards for same hexagram', () => {
    const queue = buildStudyQueue();
    // Hexagram 1 has cards A, C, G — should only get 1 teaching card
    const hex1Teaching = queue.filter(
      q => q.exerciseType === 'teaching' && q.card.hexagramId === 1
    );
    expect(hex1Teaching.length).toBe(1);
  });

  it('due cards come before new cards', () => {
    // Store a due card state
    const record = {
      schemaVersion: 1,
      cardStates: {
        '1-A': {
          cardId: '1-A',
          easeFactor: 2.5,
          interval: 1,
          repetitions: 1,
          dueDate: '2026-03-12',
          lastReviewDate: '2026-03-11',
        },
      },
      totalReviews: 1,
      lastStudyDate: '2026-03-11',
    };
    localStorage.setItem('studyRecord', JSON.stringify(record));

    const queue = buildStudyQueue();
    const firstDue = queue.findIndex(q => !q.isNew);
    const firstNew = queue.findIndex(q => q.isNew);
    expect(firstDue).toBeLessThan(firstNew);
  });
});

describe('getHexagramMastery', () => {
  it('returns unlearned when no cards studied', () => {
    expect(getHexagramMastery(1)).toBe('unlearned');
  });

  it('returns learning when some cards studied', () => {
    const record = {
      schemaVersion: 1,
      cardStates: {
        '1-A': {
          cardId: '1-A', easeFactor: 2.5, interval: 1,
          repetitions: 2, dueDate: '2026-03-15', lastReviewDate: '2026-03-12',
        },
      },
      totalReviews: 1,
      lastStudyDate: '2026-03-12',
    };
    localStorage.setItem('studyRecord', JSON.stringify(record));
    expect(getHexagramMastery(1)).toBe('learning');
  });

  it('returns mastered when all 3 cards have rep >= 4', () => {
    const makeCard = (id: string) => ({
      cardId: id, easeFactor: 2.5, interval: 15,
      repetitions: 4, dueDate: '2026-03-27', lastReviewDate: '2026-03-12',
    });
    const record = {
      schemaVersion: 1,
      cardStates: {
        '1-A': makeCard('1-A'),
        '1-C': makeCard('1-C'),
        '1-G': makeCard('1-G'),
      },
      totalReviews: 12,
      lastStudyDate: '2026-03-12',
    };
    localStorage.setItem('studyRecord', JSON.stringify(record));
    expect(getHexagramMastery(1)).toBe('mastered');
  });

  it('returns learning (not unlearned) when card was studied but repetitions reset to 0', () => {
    const record = {
      schemaVersion: 1,
      cardStates: {
        '1-A': {
          cardId: '1-A', easeFactor: 2.5, interval: 1,
          repetitions: 0, dueDate: '2026-03-13', lastReviewDate: '2026-03-12',
        },
      },
      totalReviews: 1,
      lastStudyDate: '2026-03-12',
    };
    localStorage.setItem('studyRecord', JSON.stringify(record));
    expect(getHexagramMastery(1)).toBe('learning');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/qiaoyang/Projects/zhouyi-memory && npx vitest run src/logic/studyQueue.test.ts 2>&1`

Expected: FAIL

**Step 3: Rewrite `studyQueue.ts`**

Replace the `buildStudyQueue` function and add `getHexagramMastery`. Keep `requeueFailedCard`, `getProgressInfo`, `getNextDueInfo` with minimal changes.

```typescript
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

// getProgressInfo and getNextDueInfo remain unchanged
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
```

**Step 4: Run tests**

Run: `cd /Users/qiaoyang/Projects/zhouyi-memory && npx vitest run src/logic/studyQueue.test.ts 2>&1`

Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/logic/studyQueue.ts src/logic/studyQueue.test.ts
git commit -m "feat: rewrite study queue with exercise type assignment and hexagram mastery"
```

---

### Task 7: Rewrite useStudySession Hook

**Files:**
- Modify: `src/hooks/useStudySession.ts`

**Step 1: Rewrite the hook**

Key changes:
- Remove `mode` / `setMode` state (no more user mode selection)
- Remove `quizOptions` from hook — each component generates its own options
- Add consolidation logic: when new card answered correctly, insert consolidation
- Stats tracking: all exercise types are objective, count correct/total for all
- Teaching cards: advance without SM-2 update, no stats counting

```typescript
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

  /** Advance to teaching card — no scoring, just move forward */
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
```

**Step 2: Verify build (expect errors in components that use removed props)**

Run: `cd /Users/qiaoyang/Projects/zhouyi-memory && npx tsc --noEmit 2>&1 | head -20`

Expected: Errors in App.tsx, HomePage.tsx, StudyPage.tsx — will be fixed in UI tasks.

**Step 3: Commit**

```bash
git add src/hooks/useStudySession.ts
git commit -m "feat: rewrite useStudySession for mixed exercise types"
```

---

### Task 8: UI — Teaching Card Component

**Files:**
- Create: `src/components/TeachingCard.tsx`

**Step 1: Create the component**

```typescript
// src/components/TeachingCard.tsx
import { useState } from 'react';
import type { Card } from '../models/types';
import { getHexagramById } from '../logic/cardGenerator';

interface TeachingCardProps {
  card: Card;
  onDone: () => void;
}

export default function TeachingCard({ card, onDone }: TeachingCardProps) {
  const [showTranslation, setShowTranslation] = useState(false);
  const hex = getHexagramById(card.hexagramId);

  if (!hex) return null;

  return (
    <div className="card-fade-enter flex flex-col items-center">
      <div className="w-full bg-card-bg border border-card-border rounded-xl p-8 text-center">
        {/* Hexagram symbol */}
        <div className="hexagram-symbol text-7xl text-ink mb-2">{hex.symbol}</div>
        {hex.trigram && (
          <div className="hexagram-symbol text-3xl text-ink-muted mb-4">{hex.trigram}</div>
        )}

        {/* Name */}
        <div className="text-3xl font-bold text-ink mb-6">{hex.name}</div>

        {/* Judgment */}
        <div className="text-left border-t border-card-border pt-4 mb-4">
          <div className="text-xs text-ink-muted mb-2">卦辞</div>
          <div className="text-lg text-ink leading-relaxed">{hex.judgment}</div>
          {!showTranslation ? (
            <button
              onClick={() => setShowTranslation(true)}
              className="text-xs text-cinnabar mt-2 hover:underline"
            >
              查看白话翻译
            </button>
          ) : (
            <div className="text-sm text-ink-light mt-2 leading-relaxed card-fade-enter">
              {hex.judgmentTranslation}
            </div>
          )}
        </div>

        {/* Upper/Lower trigrams */}
        <div className="border-t border-card-border pt-4 grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-xs text-ink-muted mb-1">上卦</div>
            <div className="hexagram-symbol text-2xl">{hex.upperTrigramSymbol}</div>
            <div className="text-sm text-ink mt-1">{hex.upperTrigram}</div>
          </div>
          <div>
            <div className="text-xs text-ink-muted mb-1">下卦</div>
            <div className="hexagram-symbol text-2xl">{hex.lowerTrigramSymbol}</div>
            <div className="text-sm text-ink mt-1">{hex.lowerTrigram}</div>
          </div>
        </div>
      </div>

      {/* Done button */}
      <button
        onClick={onDone}
        className="w-full mt-6 py-3.5 bg-cinnabar text-white rounded-lg font-semibold tracking-wider hover:bg-cinnabar-dark active:scale-[0.98] transition-all"
      >
        知道了
      </button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/TeachingCard.tsx
git commit -m "feat: add TeachingCard component"
```

---

### Task 9: UI — TrueFalseCard Component

**Files:**
- Create: `src/components/TrueFalseCard.tsx`

**Step 1: Create the component**

```typescript
// src/components/TrueFalseCard.tsx
import { useState, useEffect } from 'react';
import type { Card, Quality, TrueFalseQuestion } from '../models/types';
import { generateTrueFalse } from '../logic/trueFalseGenerator';

interface TrueFalseCardProps {
  card: Card;
  onAnswer: (quality: Quality) => void;
}

export default function TrueFalseCard({ card, onAnswer }: TrueFalseCardProps) {
  const [question, setQuestion] = useState<TrueFalseQuestion>(() => generateTrueFalse(card));
  const [answered, setAnswered] = useState<boolean | null>(null); // user's answer
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
```

**Step 2: Commit**

```bash
git add src/components/TrueFalseCard.tsx
git commit -m "feat: add TrueFalseCard component"
```

---

### Task 10: UI — Update QuizCard for Reverse Mode

**Files:**
- Modify: `src/components/QuizCard.tsx`

**Step 1: Update QuizCard to accept a `reverse` prop**

Add a `reverse` boolean prop. When `true`, the prompt shows `card.back` and the question framing changes. The component generates its own options internally based on `reverse`.

```typescript
// Key changes to QuizCard.tsx:

interface QuizCardProps {
  card: Card;
  reverse?: boolean;      // NEW: when true, show back as prompt, pick front
  onAnswer: (quality: Quality) => void;
}

export default function QuizCard({ card, reverse = false, onAnswer }: QuizCardProps) {
  // Generate options internally
  const [options, setOptions] = useState<QuizOption[]>([]);

  useEffect(() => {
    const opts = reverse
      ? generateReverseQuizOptions(card)
      : generateQuizOptions(card);
    setOptions(opts);
    setSelected(null);
    setFadeKey(prev => prev + 1);
  }, [card.id, reverse]);

  // The prompt text changes based on direction
  const promptText = reverse ? card.back : card.front;
  const isSymbolPrompt = reverse
    ? false  // back is always text
    : (card.type === 'A' || card.type === 'G');

  // Dimension label
  const dimensionLabel = reverse
    ? { A: '哪个是它的卦象？', C: '这是哪一卦的卦辞？', G: '哪个是它的卦象？' }[card.type]
    : { A: '此为何卦？', C: '卦辞为何？', G: '上下卦为何？' }[card.type];

  // ... rest of rendering logic uses promptText, isSymbolPrompt, dimensionLabel
  // (see existing QuizCard for structure — same layout, just different data source)
}
```

Import `generateReverseQuizOptions` from `../logic/distractorPicker` and `generateQuizOptions` from same file.

Remove `options` from props — component generates internally now.

**Step 2: Verify build**

Run: `cd /Users/qiaoyang/Projects/zhouyi-memory && npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/components/QuizCard.tsx
git commit -m "feat: update QuizCard to support reverse mode"
```

---

### Task 11: UI — Update StudyPage to Route Exercise Types

**Files:**
- Modify: `src/pages/StudyPage.tsx`

**Step 1: Update StudyPage**

Replace mode-based routing with exercise-type routing:

```typescript
import type { QueueItem, Quality, ProgressInfo } from '../models/types';
import ProgressBar from '../components/ProgressBar';
import TeachingCard from '../components/TeachingCard';
import QuizCard from '../components/QuizCard';
import TrueFalseCard from '../components/TrueFalseCard';

interface StudyPageProps {
  currentItem: QueueItem;
  progress: ProgressInfo;
  onAnswer: (quality: Quality) => void;
  onAdvanceTeaching: () => void;
  onEnd: () => void;
}

export default function StudyPage({
  currentItem, progress, onAnswer, onAdvanceTeaching, onEnd,
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

  // Badge label
  const badgeLabel = currentItem.isConsolidation ? '巩固'
    : currentItem.isRequeue ? '巩固'
    : currentItem.isNew ? '新卡'
    : '复习';

  const badgeColor = currentItem.isConsolidation || currentItem.isRequeue
    ? 'text-wrong' : currentItem.isNew ? 'text-cinnabar' : 'text-ink-muted';

  return (
    <div className="min-h-dvh bg-parchment flex flex-col">
      <ProgressBar progress={progress} />
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-xs text-ink-muted">
          <span className={badgeColor}>{badgeLabel}</span>
        </div>
        <button onClick={onEnd}
          className="text-xs text-ink-muted hover:text-ink transition-colors px-2 py-1">
          结束学习
        </button>
      </div>
      <div className="flex-1 flex items-start justify-center px-4 pt-4 pb-8">
        <div className="w-full max-w-md">{renderCard()}</div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/pages/StudyPage.tsx
git commit -m "feat: update StudyPage to route by exercise type"
```

---

### Task 12: UI — Hexagram Dictionary Page

**Files:**
- Create: `src/pages/DictionaryPage.tsx`
- Create: `src/pages/HexagramDetailPage.tsx`

**Step 1: Create DictionaryPage**

```typescript
// src/pages/DictionaryPage.tsx
import { useState } from 'react';
import { hexagrams } from '../data/hexagrams';
import { getHexagramMastery } from '../logic/studyQueue';
import type { MasteryLevel } from '../models/types';
import HexagramDetailPage from './HexagramDetailPage';

interface DictionaryPageProps {
  onBack: () => void;
}

const MASTERY_STYLES: Record<MasteryLevel, { label: string; color: string; bg: string }> = {
  unlearned: { label: '未学习', color: 'text-ink-muted/50', bg: 'bg-parchment-dark' },
  learning: { label: '学习中', color: 'text-cinnabar', bg: 'bg-cinnabar/10' },
  mastered: { label: '已掌握', color: 'text-jade', bg: 'bg-jade/10' },
};

export default function DictionaryPage({ onBack }: DictionaryPageProps) {
  const [selectedHexId, setSelectedHexId] = useState<number | null>(null);

  if (selectedHexId !== null) {
    const hex = hexagrams.find(h => h.id === selectedHexId)!;
    return <HexagramDetailPage hex={hex} onBack={() => setSelectedHexId(null)} />;
  }

  const masteredCount = hexagrams.filter(h => getHexagramMastery(h.id) === 'mastered').length;

  return (
    <div className="min-h-dvh bg-parchment">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-card-border bg-parchment-light">
        <button onClick={onBack} className="text-sm text-ink-muted hover:text-ink">← 返回</button>
        <h1 className="text-lg font-bold text-ink">卦典</h1>
        <div className="text-xs text-ink-muted">已掌握 {masteredCount}/64</div>
      </div>

      {/* Hexagram list */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-2">
        {hexagrams.map(hex => {
          const mastery = getHexagramMastery(hex.id);
          const style = MASTERY_STYLES[mastery];
          return (
            <button
              key={hex.id}
              onClick={() => setSelectedHexId(hex.id)}
              className="w-full flex items-center gap-4 p-3 bg-card-bg border border-card-border rounded-lg hover:shadow-sm transition-shadow text-left"
            >
              <div className="hexagram-symbol text-2xl w-8 text-center">{hex.symbol}</div>
              <div className="flex-1">
                <div className="text-base font-semibold text-ink">{hex.name}</div>
                <div className="text-xs text-ink-muted truncate">{hex.judgment}</div>
              </div>
              <div className={`text-xs px-2 py-1 rounded ${style.bg} ${style.color}`}>
                {style.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Create HexagramDetailPage**

```typescript
// src/pages/HexagramDetailPage.tsx
import { useState } from 'react';
import type { Hexagram } from '../models/types';
import { getCardState } from '../storage/localStorage';

interface HexagramDetailPageProps {
  hex: Hexagram;
  onBack: () => void;
}

const CARD_LABELS = [
  { type: 'A', label: '卦象 → 卦名' },
  { type: 'C', label: '卦名 → 卦辞' },
  { type: 'G', label: '卦象 → 上下卦' },
] as const;

export default function HexagramDetailPage({ hex, onBack }: HexagramDetailPageProps) {
  const [showTranslation, setShowTranslation] = useState(false);

  return (
    <div className="min-h-dvh bg-parchment">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-card-border bg-parchment-light">
        <button onClick={onBack} className="text-sm text-ink-muted hover:text-ink">← 返回</button>
        <h1 className="text-lg font-bold text-ink ml-4">{hex.name}</h1>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 animate-fade-in">
        {/* Symbol + Name */}
        <div className="text-center mb-6">
          <div className="hexagram-symbol text-7xl text-ink mb-2">{hex.symbol}</div>
          {hex.trigram && <div className="hexagram-symbol text-3xl text-ink-muted mb-2">{hex.trigram}</div>}
          <div className="text-3xl font-bold text-ink">{hex.name}</div>
        </div>

        {/* Judgment */}
        <div className="bg-card-bg border border-card-border rounded-xl p-6 mb-4">
          <div className="text-xs text-ink-muted mb-2">卦辞</div>
          <div className="text-lg text-ink leading-relaxed">{hex.judgment}</div>
          {!showTranslation ? (
            <button
              onClick={() => setShowTranslation(true)}
              className="text-xs text-cinnabar mt-3 hover:underline"
            >
              查看白话翻译
            </button>
          ) : (
            <div className="text-sm text-ink-light mt-3 leading-relaxed border-t border-card-border pt-3 card-fade-enter">
              {hex.judgmentTranslation}
            </div>
          )}
        </div>

        {/* Trigrams */}
        <div className="bg-card-bg border border-card-border rounded-xl p-6 mb-4 grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-xs text-ink-muted mb-1">上卦</div>
            <div className="hexagram-symbol text-2xl">{hex.upperTrigramSymbol}</div>
            <div className="text-sm text-ink mt-1">{hex.upperTrigram}</div>
          </div>
          <div>
            <div className="text-xs text-ink-muted mb-1">下卦</div>
            <div className="hexagram-symbol text-2xl">{hex.lowerTrigramSymbol}</div>
            <div className="text-sm text-ink mt-1">{hex.lowerTrigram}</div>
          </div>
        </div>

        {/* Card states */}
        <div className="bg-card-bg border border-card-border rounded-xl p-6">
          <div className="text-xs text-ink-muted mb-3">学习状态</div>
          {CARD_LABELS.map(({ type, label }) => {
            const state = getCardState(`${hex.id}-${type}`);
            const studied = state && state.lastReviewDate !== '';
            const reps = state?.repetitions ?? 0;
            return (
              <div key={type} className="flex items-center justify-between py-2 border-b border-card-border last:border-0">
                <span className="text-sm text-ink">{label}</span>
                <span className={`text-xs ${studied ? (reps >= 4 ? 'text-jade' : 'text-cinnabar') : 'text-ink-muted/50'}`}>
                  {!studied ? '未学习' : reps >= 4 ? '已掌握' : `学习中 (${reps}/4)`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/pages/DictionaryPage.tsx src/pages/HexagramDetailPage.tsx
git commit -m "feat: add dictionary page and hexagram detail page"
```

---

### Task 13: UI — Update App.tsx and HomePage

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/HomePage.tsx`
- Delete: `src/components/FlipCard.tsx`

**Step 1: Update HomePage — remove mode selector, add dictionary button**

Remove `mode`/`onModeChange` props. Add `onOpenDictionary` prop. Remove the flip/quiz toggle buttons, replace with a dictionary entry button.

**Step 2: Update App.tsx**

Add `'dictionary'` to phase routing. Add a `showDictionary` state (separate from session phase). Wire up `DictionaryPage`.

```typescript
// src/App.tsx
import { useState, useEffect } from 'react';
import { useStudySession } from './hooks/useStudySession';
import { isStorageAvailable } from './storage/localStorage';
import HomePage from './pages/HomePage';
import StudyPage from './pages/StudyPage';
import SummaryPage from './pages/SummaryPage';
import DictionaryPage from './pages/DictionaryPage';
import NewCardPrompt from './components/NewCardPrompt';

function App() {
  const [storageWarning, setStorageWarning] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const session = useStudySession();

  useEffect(() => {
    if (!isStorageAvailable()) setStorageWarning(true);
  }, []);

  if (showDictionary) {
    return <DictionaryPage onBack={() => setShowDictionary(false)} />;
  }

  switch (session.phase) {
    case 'idle':
      return (
        <HomePage
          progress={session.progress}
          onStart={session.startSession}
          onOpenDictionary={() => setShowDictionary(true)}
          storageWarning={storageWarning}
        />
      );

    case 'studying':
      if (!session.currentItem) {
        session.endSession();
        return null;
      }
      return (
        <StudyPage
          currentItem={session.currentItem}
          progress={session.progress}
          onAnswer={session.answerCard}
          onAdvanceTeaching={session.advanceTeaching}
          onEnd={session.endSession}
        />
      );

    case 'newCardPrompt':
      return (
        <NewCardPrompt
          count={session.stats.newCount}
          onContinue={session.continueAfterPrompt}
          onEnd={session.endSession}
        />
      );

    case 'summary':
      return (
        <SummaryPage
          stats={session.stats}
          progress={session.progress}
          nextDueInfo={session.nextDueInfo}
          isAllDone={false}
          onGoHome={session.goHome}
        />
      );

    case 'allDone':
      return (
        <SummaryPage
          stats={session.stats}
          progress={session.progress}
          nextDueInfo={session.nextDueInfo}
          isAllDone={true}
          onGoHome={session.goHome}
        />
      );
  }
}

export default App;
```

**Step 3: Delete FlipCard.tsx**

```bash
rm src/components/FlipCard.tsx
```

**Step 4: Verify full build**

Run: `cd /Users/qiaoyang/Projects/zhouyi-memory && npx tsc --noEmit 2>&1`

Expected: No errors

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: update App and HomePage, remove FlipCard, add dictionary routing"
```

---

### Task 14: Update SummaryPage Stats Display

**Files:**
- Modify: `src/pages/SummaryPage.tsx`

**Step 1: Update stats display**

Since all exercise types are now objective, always show accuracy (remove the `hasQuizStats` conditional). The stats labels should be generic ("正确率" not "四选一正确率").

Change line:
```typescript
// OLD
{hasQuizStats && (
  <div ...><div ...>四选一正确率</div>...
```

To:
```typescript
// NEW — always show, since all types are objective
{stats.totalAnswered > 0 && (
  <div className="border-t border-card-border mt-4 pt-4">
    <div className="text-xs text-ink-muted mb-1">正确率</div>
    <div className="text-lg font-bold text-jade">{accuracy}%</div>
  </div>
)}
```

**Step 2: Commit**

```bash
git add src/pages/SummaryPage.tsx
git commit -m "feat: update SummaryPage for unified stats display"
```

---

### Task 15: Run All Tests and Verify

**Files:** None (verification only)

**Step 1: Run all tests**

Run: `cd /Users/qiaoyang/Projects/zhouyi-memory && npx vitest run 2>&1`

Expected: All tests pass (sm2.test.ts, exerciseAssigner.test.ts, trueFalseGenerator.test.ts, distractorPicker.test.ts, studyQueue.test.ts)

**Step 2: Run build**

Run: `cd /Users/qiaoyang/Projects/zhouyi-memory && npm run build 2>&1`

Expected: Build succeeds with no errors

**Step 3: Run dev server and manual smoke test**

Run: `cd /Users/qiaoyang/Projects/zhouyi-memory && npm run dev`

Manual checks:
- [ ] Homepage shows "开始学习" and "卦典" buttons (no mode selector)
- [ ] Starting a session shows a teaching card for the first hexagram
- [ ] After "知道了", a forward quiz appears
- [ ] Answering correctly inserts a consolidation card 3-5 items later
- [ ] Answering incorrectly requeues the card
- [ ] Dictionary page lists 64 hexagrams with mastery status
- [ ] Clicking a hexagram shows detail page with translation toggle
- [ ] Summary page shows unified accuracy stats

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address issues found during smoke testing"
```
