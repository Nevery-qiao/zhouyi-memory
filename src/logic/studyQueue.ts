import type { Card, QueueItem } from '../models/types';
import { getAllCards } from './cardGenerator';
import { loadStudyRecord } from '../storage/localStorage';
import { getToday, isDue, hasBeenStudied } from '../algorithm/sm2';

/**
 * Fisher-Yates shuffle（原地打乱数组）
 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 构建学习 session 队列
 *
 * 1. 到期复习卡（按 dueDate 排序后 shuffle）
 * 2. 新卡片（按卦序排列）
 */
export function buildStudyQueue(): QueueItem[] {
  const allCards = getAllCards();
  const record = loadStudyRecord();

  const dueItems: QueueItem[] = [];
  const newItems: QueueItem[] = [];

  for (const card of allCards) {
    const state = record.cardStates[card.id];

    if (!state || !hasBeenStudied(state)) {
      // 未学过的新卡
      newItems.push({ card, isNew: true, isRequeue: false });
    } else if (isDue(state)) {
      // 已学过且到期
      dueItems.push({ card, isNew: false, isRequeue: false });
    }
    // 已学过但未到期 → 不出现在队列中
  }

  // 到期卡 shuffle，避免同一卦的 A/C/G 卡连续出现
  const shuffledDue = shuffle(dueItems);

  // 新卡按卦序（由 generateAllCards 保证）
  return [...shuffledDue, ...newItems];
}

/**
 * 将答错卡片插入队列尾部（3-5 张后重新出现）
 * 返回新队列
 */
export function requeueFailedCard(
  queue: QueueItem[],
  currentIndex: number,
  card: Card,
): QueueItem[] {
  const newQueue = [...queue];
  // 插入位置：当前位置 + 3~5 张后
  const offset = 3 + Math.floor(Math.random() * 3); // 3, 4, or 5
  const insertAt = Math.min(currentIndex + offset, newQueue.length);
  newQueue.splice(insertAt, 0, {
    card,
    isNew: false,
    isRequeue: true, // 标记为重排卡，不更新 SM-2
  });
  return newQueue;
}

/**
 * 计算全局进度信息
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
      if (state.repetitions >= 1) {
        masteredCount++;
      }
      if (state.dueDate <= today) {
        dueCount++;
      }
    }
  }

  return {
    masteredCount,
    totalCards: allCards.length,
    dueCount,
    newLearnedCount,
  };
}

/**
 * 获取最近到期的复习日期和数量（用于完成页展示）
 */
export function getNextDueInfo(): { date: string; count: number } | null {
  const allCards = getAllCards();
  const record = loadStudyRecord();
  const today = getToday();

  // 找出所有未来到期卡片（dueDate > today）
  const futureDates: string[] = [];
  for (const card of allCards) {
    const state = record.cardStates[card.id];
    if (state && hasBeenStudied(state) && state.dueDate > today) {
      futureDates.push(state.dueDate);
    }
  }

  if (futureDates.length === 0) return null;

  // 找最近的日期
  futureDates.sort();
  const nextDate = futureDates[0];
  const count = futureDates.filter(d => d === nextDate).length;

  return { date: nextDate, count };
}
