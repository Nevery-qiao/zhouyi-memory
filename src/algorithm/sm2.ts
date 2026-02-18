import type { CardState, Quality } from '../models/types';

/** 获取今天的日期字符串 YYYY-MM-DD（本地时间） */
export function getToday(): string {
  return new Date().toLocaleDateString('en-CA');
}

/** 计算日期 + N 天后的 YYYY-MM-DD */
export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('en-CA');
}

/** 创建新卡片的初始状态 */
export function createInitialCardState(cardId: string): CardState {
  const today = getToday();
  return {
    cardId,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: today,
    lastReviewDate: '',
  };
}

/**
 * SM-2 算法核心：根据 quality 更新卡片状态
 *
 * quality 取值：
 *   翻卡模式：1(不会) / 3(想起来了) / 5(很简单)
 *   四选一模式：1(选错) / 4(选对)
 *
 * 返回新的 CardState（不修改输入）
 */
export function updateCardState(state: CardState, quality: Quality): CardState {
  const today = getToday();
  let { easeFactor, interval, repetitions } = state;

  if (quality < 3) {
    // 答错：重置间隔和连续次数，但保留 easeFactor
    repetitions = 0;
    interval = 1;
  } else {
    // 答对：根据连续正确次数计算新间隔
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      // 使用原计划的 interval（非实际过去天数）作为基数
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // 更新 easeFactor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // 参数边界 clamp
  easeFactor = Math.max(1.3, easeFactor);
  interval = Math.max(1, Math.min(365, interval));

  return {
    cardId: state.cardId,
    easeFactor,
    interval,
    repetitions,
    dueDate: addDays(today, interval),
    lastReviewDate: today,
  };
}

/** 判断卡片是否到期（dueDate <= today） */
export function isDue(state: CardState): boolean {
  return state.dueDate <= getToday();
}

/** 判断卡片是否已经学过 */
export function hasBeenStudied(state: CardState): boolean {
  return state.lastReviewDate !== '';
}
