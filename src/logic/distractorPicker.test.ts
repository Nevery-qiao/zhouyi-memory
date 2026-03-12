import { describe, it, expect } from 'vitest';
import { generateQuizOptions, generateReverseQuizOptions } from './distractorPicker';
import type { Card } from '../models/types';

const cardA: Card = { id: '1-A', type: 'A', hexagramId: 1, front: '☰', back: '乾' };

describe('generateQuizOptions (existing)', () => {
  it('returns 4 options with one correct', () => {
    const opts = generateQuizOptions(cardA);
    expect(opts).toHaveLength(4);
    expect(opts.filter(o => o.isCorrect)).toHaveLength(1);
  });

  it('correct option text is card.back', () => {
    const opts = generateQuizOptions(cardA);
    const correct = opts.find(o => o.isCorrect)!;
    expect(correct.text).toBe('乾');
  });
});

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
    expect(correct.text).toBe('☰');
  });

  it('no duplicate option texts', () => {
    const opts = generateReverseQuizOptions(cardA);
    const texts = opts.map(o => o.text);
    expect(new Set(texts).size).toBe(4);
  });
});
