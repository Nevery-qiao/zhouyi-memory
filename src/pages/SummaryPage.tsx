import type { SessionStats, ProgressInfo } from '../models/types';

interface SummaryPageProps {
  stats: SessionStats;
  progress: ProgressInfo;
  nextDueInfo: { date: string; count: number } | null;
  isAllDone: boolean;
  onGoHome: () => void;
}

function formatDate(dateStr: string): string {
  const today = new Date();
  const target = new Date(dateStr + 'T00:00:00');
  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return '今天';
  if (diffDays === 1) return '明天';
  if (diffDays === 2) return '后天';
  return `${diffDays} 天后`;
}

export default function SummaryPage({ stats, progress, nextDueInfo, isAllDone, onGoHome }: SummaryPageProps) {
  const hasQuizStats = stats.totalAnswered > 0;
  const accuracy = hasQuizStats ? Math.round((stats.correctCount / stats.totalAnswered) * 100) : 0;

  return (
    <div className="min-h-dvh bg-parchment flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center animate-fade-in">
        {isAllDone ? (
          /* 全部完成空状态 */
          <>
            <div className="text-5xl mb-6">🎋</div>
            <h2 className="text-xl font-bold text-ink mb-2">今日复习已完成</h2>
            <p className="text-sm text-ink-muted mb-8">学如不及，犹恐失之</p>

            <div className="bg-card-bg border border-card-border rounded-xl p-6 mb-8">
              {nextDueInfo ? (
                <div className="mb-4">
                  <div className="text-xs text-ink-muted mb-1">下次复习</div>
                  <div className="text-lg font-bold text-cinnabar">
                    {formatDate(nextDueInfo.date)}
                    <span className="text-sm font-normal text-ink-muted ml-2">
                      {nextDueInfo.count} 张到期
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="text-xs text-ink-muted mb-1">下次复习</div>
                  <div className="text-lg text-ink-muted">暂无待复习卡片</div>
                </div>
              )}
              <div className="border-t border-card-border pt-4">
                <div className="text-xs text-ink-muted mb-1">总进度</div>
                <div className="text-lg font-bold text-ink">
                  {progress.masteredHex} / {progress.totalHex}
                  <span className="text-sm font-normal text-ink-muted ml-2">卦已掌握</span>
                </div>
                <div className="mt-2 h-2 bg-parchment-dark rounded-full overflow-hidden">
                  <div
                    className="h-full bg-jade rounded-full transition-all"
                    style={{ width: `${(progress.masteredHex / progress.totalHex) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Session 统计 */
          <>
            <div className="text-5xl mb-6">📜</div>
            <h2 className="text-xl font-bold text-ink mb-2">本次学习完成</h2>
            <p className="text-sm text-ink-muted mb-8">温故而知新，可以为师矣</p>

            <div className="bg-card-bg border border-card-border rounded-xl p-6 mb-8">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-ink">{stats.reviewedCount}</div>
                  <div className="text-xs text-ink-muted mt-1">复习卡片</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-cinnabar">{stats.newCount}</div>
                  <div className="text-xs text-ink-muted mt-1">新学卡片</div>
                </div>
              </div>
              {stats.totalAnswered > 0 && (
                <div className="border-t border-card-border mt-4 pt-4">
                  <div className="text-xs text-ink-muted mb-1">正确率</div>
                  <div className="text-lg font-bold text-jade">{accuracy}%</div>
                </div>
              )}
            </div>
          </>
        )}

        <button
          onClick={onGoHome}
          className="w-full py-3.5 bg-cinnabar text-white rounded-lg font-semibold tracking-wider hover:bg-cinnabar-dark active:scale-[0.98] transition-all"
        >
          返回首页
        </button>
      </div>
    </div>
  );
}
