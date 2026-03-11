import { useState, useEffect } from 'react';
import { useStudySession } from './hooks/useStudySession';
import { isStorageAvailable } from './storage/localStorage';
import HomePage from './pages/HomePage';
import StudyPage from './pages/StudyPage';
import SummaryPage from './pages/SummaryPage';
import NewCardPrompt from './components/NewCardPrompt';

function App() {
  const [storageWarning, setStorageWarning] = useState(false);
  const session = useStudySession();

  useEffect(() => {
    if (!isStorageAvailable()) {
      setStorageWarning(true);
    }
  }, []);

  switch (session.phase) {
    case 'idle':
      return (
        <HomePage
          progress={session.progress}
          mode={session.mode}
          onModeChange={session.setMode}
          onStart={session.startSession}
          storageWarning={storageWarning}
        />
      );

    case 'studying':
      if (!session.currentItem) {
        // 队列耗尽，自动进入完成页
        session.endSession();
        return null;
      }
      return (
        <StudyPage
          currentItem={session.currentItem}
          mode={session.mode}
          progress={session.progress}
          quizOptions={session.quizOptions}
          onAnswer={session.answerCard}
          onEnd={session.endSession}
        />
      );

    case 'newCardPrompt':
      return (
        <NewCardPrompt
          count={session.stats.newCount}
          onContinue={session.continueAfterPrompt}
          onEnd={session.endSession}
        />
      );

    case 'summary':
      return (
        <SummaryPage
          stats={session.stats}
          progress={session.progress}
          nextDueInfo={session.nextDueInfo}
          isAllDone={false}
          onGoHome={session.goHome}
        />
      );

    case 'allDone':
      return (
        <SummaryPage
          stats={session.stats}
          progress={session.progress}
          nextDueInfo={session.nextDueInfo}
          isAllDone={true}
          onGoHome={session.goHome}
        />
      );
  }
}

export default App;
