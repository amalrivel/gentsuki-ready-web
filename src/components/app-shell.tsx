import { useEffect, useMemo, useState } from 'preact/hooks';
import { QUIZ_SETS, UI_TEXT } from '../lib/constants';
import type { QuizSetMeta, UserPreferences } from '../types/quiz';
import { useQuiz } from '../hooks/use-quiz';
import { SetSelector } from './set-selector';
import { QuizCard } from './quiz-card';
import { ResultPanel } from './result-panel';
import {
  clearAllProgress,
  loadActiveSet,
  loadPreferences,
  saveActiveSet,
  savePreferences,
} from '../lib/storage';

export function AppShell() {
  const [selectedSetId, setSelectedSetId] = useState<string | null>(() => loadActiveSet());
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadPreferences());

  const selectedSet = useMemo<QuizSetMeta | null>(
    () => QUIZ_SETS.find((item) => item.id === selectedSetId) ?? null,
    [selectedSetId],
  );

  const quiz = useQuiz(selectedSet);

  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  function handleSelect(setId: string) {
    setSelectedSetId(setId);
    saveActiveSet(setId);
  }

  function handleResetAllProgress() {
    if (!confirm('Reset semua progress? Tindakan ini tidak dapat dibatalkan.')) return;
    clearAllProgress();
    quiz.restartQuiz();
  }

  return (
    <main class="container">
      <header class="page-header">
        <h1>{UI_TEXT.appTitle}</h1>
      </header>

      {quiz.status === 'idle' && (
        <section class="panel">
          <p>Pilih set untuk mulai.</p>
        </section>
      )}

      {quiz.status === 'loading' && (
        <section class="panel">
          <h2>Memuat Set</h2>
          <p>Memuat soal...</p>
        </section>
      )}

      {quiz.status === 'error' && (
        <section class="panel">
          <h2>Terjadi masalah</h2>
          <p>{quiz.errorMessage ?? 'Gagal memuat data.'}</p>
          <button type="button" onClick={quiz.retryLoad}>Coba lagi</button>
        </section>
      )}

      {quiz.status === 'ready' && quiz.currentQuestion && (
        <QuizCard quiz={quiz} preferences={preferences} />
      )}

      {quiz.status === 'finished' && (
        <ResultPanel
          setTitle={selectedSet?.title ?? 'Set quiz'}
          score={quiz.score}
          maxScore={quiz.maxScore}
          onRestart={quiz.restartQuiz}
        />
      )}

      <SetSelector
        sets={QUIZ_SETS}
        selectedSetId={selectedSetId}
        onSelect={handleSelect}
      />

      <section class="panel settings-panel">
        <h2 class="panel-title">Pengaturan Tampilan</h2>
        <label class="settings-field">
          <input
            type="checkbox"
            checked={preferences.showFurigana}
            onChange={(event) =>
              setPreferences((prev) => ({ ...prev, showFurigana: event.currentTarget.checked }))
            }
          />
          <span>Tampilkan furigana</span>
        </label>
        <button type="button" class="btn-reset-all" onClick={handleResetAllProgress}>
          Reset Semua Progress
        </button>

        <label class="settings-field">
          <span>Skala font: {preferences.fontScale}%</span>
          <input
            type="range"
            min={90}
            max={160}
            step={5}
            value={preferences.fontScale}
            onInput={(event) =>
              setPreferences((prev) => ({
                ...prev,
                fontScale: Math.max(90, Math.min(160, Number(event.currentTarget.value))),
              }))
            }
          />
        </label>
      </section>

      
    </main>
  );
}
