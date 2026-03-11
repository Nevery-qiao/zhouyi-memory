/** 六十四卦静态数据 */
export interface Hexagram {
  id: number;              // 1-64，按卦序
  name: string;            // 卦名，如「乾」
  symbol: string;          // 六爻卦象 Unicode，如「䷀」
  trigram: string;         // 八卦卦象（仅八经卦有），如「☰」
  judgment: string;        // 卦辞
  upperTrigram: string;    // 上卦名称，如「乾」
  lowerTrigram: string;    // 下卦名称，如「乾」
  upperTrigramSymbol: string; // 上卦卦象，如「☰」
  lowerTrigramSymbol: string; // 下卦卦象，如「☰」
}

/** 卡片类型 */
export type CardType = 'A' | 'C' | 'G';

/** 卡片定义（静态，从卦数据生成） */
export interface Card {
  id: string;              // 格式: "{hexagramId}-{type}"，如 "1-A"
  type: CardType;
  hexagramId: number;
  front: string;           // 正面显示内容
  back: string;            // 背面显示内容
}

/** SM-2 卡片学习状态 */
export interface CardState {
  cardId: string;
  easeFactor: number;      // 难度因子，初始 2.5
  interval: number;        // 当前间隔（天）
  repetitions: number;     // 连续正确次数
  dueDate: string;         // 下次复习日期 (YYYY-MM-DD)
  lastReviewDate: string;  // 上次复习日期 (YYYY-MM-DD)
}

/** 本地持久化的学习记录 */
export interface StudyRecord {
  schemaVersion: number;                   // 数据版本号，初始为 1
  cardStates: Record<string, CardState>;   // cardId → 卡片状态
  totalReviews: number;                    // 累计复习次数
  lastStudyDate: string;                   // 上次学习日期 (YYYY-MM-DD)
}

/** 学习模式 */
export type StudyMode = 'flip' | 'quiz';

/** 翻卡自评质量分 */
export type FlipQuality = 1 | 3 | 5;

/** 四选一自动评分 */
export type QuizQuality = 1 | 4;

/** 所有可能的 quality 值 */
export type Quality = FlipQuality | QuizQuality;

/** 学习队列中的卡片项 */
export interface QueueItem {
  card: Card;
  isNew: boolean;          // 是否为新卡
  isRequeue: boolean;      // 是否为答错后重排的卡片（不更新 SM-2）
}

/** 本次 session 学习统计 */
export interface SessionStats {
  reviewedCount: number;   // 复习卡片数
  newCount: number;        // 新学卡片数
  correctCount: number;    // 答对次数（四选一模式）
  totalAnswered: number;   // 总答题次数（四选一模式）
}

/** 四选一选项 */
export interface QuizOption {
  text: string;
  isCorrect: boolean;
}

/** 全局进度信息 */
export interface ProgressInfo {
  masteredCount: number;   // 已掌握卡片数 (repetitions ≥ 1)
  totalCards: number;      // 总卡片数 (192)
  dueCount: number;        // 今日待复习数
  newLearnedCount: number; // 本次 session 已学新卡数
}
