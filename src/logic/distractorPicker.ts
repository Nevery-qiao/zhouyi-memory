import type { Card, QuizOption } from '../models/types';
import { hexagrams } from '../data/hexagrams';
import { getAllCards } from './cardGenerator';

/**
 * 为四选一模式生成 4 个选项（1 正确 + 3 干扰项）
 *
 * 规则：
 * - 干扰项从全部 64 卦中随机抽取，不限已学过的卦
 * - 干扰项显示文本不能与正确答案相同
 * - 4 个选项随机排列
 */
export function generateQuizOptions(card: Card): QuizOption[] {
  const correctAnswer = card.back;

  // 根据卡片类型，收集所有可能的答案
  const allAnswers = getAllPossibleAnswers(card.type);

  // 排除与正确答案相同的文本
  const pool = allAnswers.filter(a => a !== correctAnswer);

  // 随机挑选 3 个干扰项
  const distractors = pickRandom(pool, 3);

  // 构建选项数组
  const options: QuizOption[] = [
    { text: correctAnswer, isCorrect: true },
    ...distractors.map(text => ({ text, isCorrect: false })),
  ];

  // 随机打乱顺序
  return shuffleArray(options);
}

/**
 * 根据卡片类型获取所有可能的答案文本
 */
function getAllPossibleAnswers(cardType: string): string[] {
  switch (cardType) {
    case 'A':
      // 卦象→卦名：所有卦名
      return hexagrams.map(h => h.name);
    case 'C':
      // 卦名→卦辞：所有卦辞
      return hexagrams.map(h => h.judgment);
    case 'G': {
      // 卦象→上下卦：所有上下卦组合
      const allCards = getAllCards();
      return allCards
        .filter(c => c.type === 'G')
        .map(c => c.back);
    }
    default:
      return [];
  }
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = shuffleArray([...arr]);
  return shuffled.slice(0, count);
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
