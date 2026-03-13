/** 六十四卦静态数据 */
export interface Hexagram {
  id: number;              // 1-64，按卦序
  name: string;            // 卦名，如「乾」
  symbol: string;          // 六爻卦象 Unicode，如「䷀」
  trigram: string;         // 八卦卦象（仅八经卦有），如「☰」
  judgment: string;        // 卦辞
  judgmentTranslation: string; // 卦辞白话翻译
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

/** 练习题型 */
export type ExerciseType = 'teaching' | 'quiz-forward' | 'true-false' | 'quiz-reverse';

/** 客观评分质量分：答对=4，答错=1 */
export type Quality = 1 | 4;

/** 学习队列中的卡片项 */
export interface QueueItem {
  card: Card;
  exerciseType: ExerciseType;
  isNew: boolean;          // 是否为新卡
  isRequeue: boolean;      // 是否为答错后重排的卡片（不更新 SM-2）
  isConsolidation: boolean; // 是否为延迟巩固卡片（不更新 SM-2）
}

/** 本次 session 学习统计 */
export interface SessionStats {
  reviewedCount: number;   // 复习卡片数
  newCount: number;        // 新学卡片数
  correctCount: number;    // 答对次数
  totalAnswered: number;   // 总答题次数
}

/** 四选一选项 */
export interface QuizOption {
  text: string;
  isCorrect: boolean;
}

/** 全局进度信息 */
export interface ProgressInfo {
  masteredHex: number;     // 已掌握卦数 (3张卡全部 rep ≥ 4)
  learningHex: number;     // 学习中卦数
  totalHex: number;        // 总卦数 (64)
  totalCards: number;      // 总卡片数 (192)
  studiedCards: number;    // 已学习卡片数
  newLearnedCount: number; // 本次 session 已学新卡数
}

/** 卦典掌握度 */
export type MasteryLevel = 'unlearned' | 'learning' | 'mastered';

/** 判断对错题数据 */
export interface TrueFalseQuestion {
  front: string;          // 题面，如卦象符号
  claim: string;          // 声称的答案（可能正确也可能错误）
  isCorrect: boolean;     // 配对是否正确
  dimension: string;      // 维度标签，如「此为何卦？」
}
