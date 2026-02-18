import type { ProgressInfo, StudyMode } from '../models/types';

interface HomePageProps {
  progress: ProgressInfo;
  mode: StudyMode;
  onModeChange: (mode: StudyMode) => void;
  onStart: () => void;
  storageWarning: boolean;
}

export default function HomePage({ progress, mode, onModeChange, onStart, storageWarning }: HomePageProps) {
  return (
    <div className="min-h-dvh bg-parchment flex flex-col">
      {/* 隐私浏览警告 */}
      {storageWarning && (
        <div className="bg-cinnabar/10 text-cinnabar-dark px-4 py-2 text-sm text-center border-b border-cinnabar/20">
          您正在使用隐私浏览模式，关闭窗口后学习进度将丢失
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full">
        {/* 标题 */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-3xl font-bold text-ink tracking-widest mb-2">周易记忆卡</h1>
          <p className="text-ink-muted text-sm">以间隔重复之法，习六十四卦之要</p>
        </div>

        {/* 统计卡片 */}
        <div className="w-full bg-card-bg border border-card-border rounded-lg p-6 mb-8 animate-fade-in">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-ink">{progress.masteredCount}</div>
              <div className="text-xs text-ink-muted mt-1">已掌握</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-cinnabar">{progress.dueCount}</div>
              <div className="text-xs text-ink-muted mt-1">待复习</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-ink-light">{progress.totalCards}</div>
              <div className="text-xs text-ink-muted mt-1">总卡片</div>
            </div>
          </div>
          {/* 进度条 */}
          <div className="mt-4 h-2 bg-parchment-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-jade rounded-full transition-all duration-500"
              style={{ width: `${(progress.masteredCount / progress.totalCards) * 100}%` }}
            />
          </div>
          <div className="text-xs text-ink-muted text-center mt-2">
            {progress.totalCards > 0
              ? `${Math.round((progress.masteredCount / progress.totalCards) * 100)}% 完成`
              : '尚未开始'}
          </div>
        </div>

        {/* 模式切换 */}
        <div className="w-full flex bg-parchment-dark rounded-lg p-1 mb-6 animate-fade-in">
          <button
            onClick={() => onModeChange('flip')}
            className={`flex-1 py-2 text-sm rounded-md transition-all ${
              mode === 'flip'
                ? 'bg-card-bg text-ink shadow-sm font-semibold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            翻卡片
          </button>
          <button
            onClick={() => onModeChange('quiz')}
            className={`flex-1 py-2 text-sm rounded-md transition-all ${
              mode === 'quiz'
                ? 'bg-card-bg text-ink shadow-sm font-semibold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            四选一
          </button>
        </div>

        {/* 开始学习按钮 */}
        <button
          onClick={onStart}
          className="w-full py-3.5 bg-cinnabar text-white rounded-lg font-semibold tracking-wider hover:bg-cinnabar-dark active:scale-[0.98] transition-all animate-fade-in"
        >
          开始学习
        </button>
      </div>

      {/* 底部 */}
      <div className="text-center py-4 text-xs text-ink-muted/50">
        周易记忆卡 v1.0
      </div>
    </div>
  );
}
