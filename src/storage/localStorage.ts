import type { StudyRecord, CardState } from '../models/types';
import { getToday } from '../algorithm/sm2';

const STORAGE_KEY = 'studyRecord';
const STORAGE_TEST_KEY = '__zhouyi_storage_test__';

function createDefaultRecord(): StudyRecord {
  return {
    schemaVersion: 1,
    cardStates: {},
    totalReviews: 0,
    lastStudyDate: '',
  };
}

/** 检测 localStorage 是否可用（隐私浏览模式可能禁用） */
export function isStorageAvailable(): boolean {
  try {
    localStorage.setItem(STORAGE_TEST_KEY, '1');
    localStorage.removeItem(STORAGE_TEST_KEY);
    return true;
  } catch {
    return false;
  }
}

/** 加载学习记录。解析失败则重置并返回默认值。 */
export function loadStudyRecord(): StudyRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultRecord();

    const data = JSON.parse(raw);

    // 校验 schemaVersion
    if (!data || typeof data.schemaVersion !== 'number') {
      console.warn('学习数据异常，已重置。');
      return createDefaultRecord();
    }

    // v1 — 当前版本，无需迁移
    if (data.schemaVersion === 1) {
      return data as StudyRecord;
    }

    // 未知版本，重置
    console.warn('未知数据版本，已重置。');
    return createDefaultRecord();
  } catch {
    console.warn('学习数据解析失败，已重置。');
    return createDefaultRecord();
  }
}

/** 保存学习记录。捕获写入异常（如 QuotaExceededError）。 */
export function saveStudyRecord(record: StudyRecord): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch (e) {
    console.error('保存学习数据失败：', e);
    return false;
  }
}

/** 更新单张卡片状态并立即保存（逐卡保存） */
export function saveCardState(cardState: CardState): boolean {
  const record = loadStudyRecord();
  record.cardStates[cardState.cardId] = cardState;
  record.totalReviews += 1;
  record.lastStudyDate = getToday();
  return saveStudyRecord(record);
}

/** 获取单张卡片状态 */
export function getCardState(cardId: string): CardState | undefined {
  const record = loadStudyRecord();
  return record.cardStates[cardId];
}
