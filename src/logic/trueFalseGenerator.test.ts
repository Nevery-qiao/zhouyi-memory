import { describe, it, expect, vi } from 'vitest';
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
    vi.spyOn(Math, 'random').mockReturnValue(0.3);
    const q = generateTrueFalse(cardA);
    expect(q.isCorrect).toBe(true);
    expect(q.claim).toBe('乾');
    vi.restoreAllMocks();
  });

  it('when isCorrect=false, claim differs from card.back', () => {
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
