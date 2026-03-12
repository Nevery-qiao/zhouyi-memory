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
