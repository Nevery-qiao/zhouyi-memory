interface NewCardPromptProps {
  count: number;
  onContinue: () => void;
  onEnd: () => void;
}

export default function NewCardPrompt({ count, onContinue, onEnd }: NewCardPromptProps) {
  return (
    <div className="min-h-dvh bg-parchment flex items-center justify-center px-6">
      <div className="max-w-sm w-full bg-card-bg border border-card-border rounded-xl p-8 text-center animate-fade-in">
        <div className="text-4xl mb-4">📖</div>
        <h2 className="text-lg font-bold text-ink mb-2">学习提醒</h2>
        <p className="text-sm text-ink-light leading-relaxed mb-6">
          今天已学 <b className="text-cinnabar">{count}</b> 张新卡，建议先到这里，明天复习后再学新的。
        </p>
        <div className="space-y-3">
          <button
            onClick={onContinue}
            className="w-full py-3 border border-cinnabar/30 text-cinnabar rounded-lg font-semibold text-sm hover:bg-cinnabar/5 active:scale-[0.98] transition-all"
          >
            继续学新卡
          </button>
          <button
            onClick={onEnd}
            className="w-full py-3 bg-cinnabar text-white rounded-lg font-semibold text-sm hover:bg-cinnabar-dark active:scale-[0.98] transition-all"
          >
            结束学习
          </button>
        </div>
      </div>
    </div>
  );
}
