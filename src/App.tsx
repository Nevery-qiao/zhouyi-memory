import { useState, useEffect } from 'react';
import { useStudySession } from './hooks/useStudySession';
import { isStorageAvailable } from './storage/localStorage';
import HomePage from './pages/HomePage';
import StudyPage from './pages/StudyPage';
import SummaryPage from './pages/SummaryPage';
import DictionaryPage from './pages/DictionaryPage';
import NewCardPrompt from './components/NewCardPrompt';

function App() {
  const [storageWarning, setStorageWarning] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const session = useStudySession();

  useEffect(() => {
    if (!isStorageAvailable()) setStorageWarning(true);
  }, []);

  if (showDictionary) {
    return <DictionaryPage onBack={() => setShowDictionary(false)} />;
  }

  switch (session.phase) {
    case 'idle':
      return (
        <HomePage
          progress={session.progress}
          onStart={session.startSession}
          onOpenDictionary={() => setShowDictionary(true)}
          storageWarning={storageWarning}
        />
      );

    case 'studying':
      if (!session.currentItem) {
        session.endSession();
        return null;
      }
      return (
        <StudyPage
          currentItem={session.currentItem}
          currentIndex={session.currentIndex}
          queueLength={session.queueLength}
          onAnswer={session.answerCard}
          onAdvanceTeaching={session.advanceTeaching}
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
