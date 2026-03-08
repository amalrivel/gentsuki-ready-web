import { useMemo, useState } from 'preact/hooks';
import { QUIZ_SETS, UI_TEXT } from '../lib/constants';
import type { QuizSetMeta } from '../types/quiz';
import { useQuiz } from '../hooks/use-quiz';
import { SetSelector } from './set-selector';
import { LoadingView } from './loading-view';
import { ErrorView } from './error-view';
import { QuizCard } from './quiz-card';
import { ResultPanel } from './result-panel';
import { loadActiveSet, saveActiveSet } from '../lib/storage';

export function AppShell() {
  const [selectedSetId, setSelectedSetId] = useState<string | null>(() => loadActiveSet());

  const selectedSet = useMemo<QuizSetMeta | null>(
    () => QUIZ_SETS.find((item) => item.id === selectedSetId) ?? null,
    [selectedSetId],
  );

  const quiz = useQuiz(selectedSet);

  function handleSelect(setId: string) {
    setSelectedSetId(setId);
    saveActiveSet(setId);
  }

  return (
    <main class="container">
      <header class="page-header">
        <h1>{UI_TEXT.appTitle}</h1>
        <p>{UI_TEXT.appSubtitle}</p>
      </header>

      <SetSelector
        sets={QUIZ_SETS}
        selectedSetId={selectedSetId}
        onSelect={handleSelect}
      />

      {quiz.status === 'idle' && (
        <section class="panel">
          <p>Pilih set untuk mulai.</p>
        </section>
      )}

      {quiz.status === 'loading' && <LoadingView />}

      {quiz.status === 'error' && (
        <ErrorView
          message={quiz.errorMessage ?? 'Gagal memuat data.'}
          onRetry={quiz.retryLoad}
        />
      )}

      {quiz.status === 'ready' && quiz.currentQuestion && (
        <QuizCard quiz={quiz} />
      )}

      {quiz.status === 'finished' && (
        <ResultPanel
          setTitle={selectedSet?.title ?? 'Set quiz'}
          score={quiz.score}
          total={quiz.total}
          onRestart={quiz.restartQuiz}
        />
      )}
    </main>
  );
}