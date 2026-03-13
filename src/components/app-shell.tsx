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
  loadProgress,
  saveActiveSet,
  savePreferences,
} from '../lib/storage';

export function AppShell() {
  const [previewSetId, setPreviewSetId] = useState<string | null>(() => loadActiveSet());
  const [activeSetId, setActiveSetId] = useState<string | null>(() => loadActiveSet());
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadPreferences());

  const activeSet = useMemo<QuizSetMeta | null>(
    () => QUIZ_SETS.find((item) => item.id === activeSetId) ?? null,
    [activeSetId],
  );

  const previewSet = useMemo<QuizSetMeta | null>(
    () => QUIZ_SETS.find((item) => item.id === previewSetId) ?? null,
    [previewSetId],
  );

  const hasSavedProgress = useMemo(
    () => (previewSetId ? loadProgress(previewSetId) !== null : false),
    [previewSetId],
  );

  const quiz = useQuiz(activeSet);

  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  // Preview panel is shown when user has selected a set but not yet confirmed start
  const showPreview = previewSetId !== null && previewSetId !== activeSetId;

  function handleSelect(setId: string) {
    setPreviewSetId(setId);
  }

  function handleStart() {
    if (!previewSetId) return;
    setActiveSetId(previewSetId);
    saveActiveSet(previewSetId);
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

      {showPreview ? (
        <section class="panel">
          <h2 class="panel-title">{previewSet?.title ?? previewSetId}</h2>
          {hasSavedProgress && <p>Progress tersimpan tersedia untuk set ini.</p>}
          <button type="button" class="btn-start" onClick={handleStart}>
            {hasSavedProgress ? 'Lanjutkan' : 'Mulai'}
          </button>
        </section>
      ) : (
        <>
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
              setTitle={activeSet?.title ?? 'Set quiz'}
              score={quiz.score}
              maxScore={quiz.maxScore}
              onRestart={quiz.restartQuiz}
            />
          )}
        </>
      )}

      <SetSelector
        sets={QUIZ_SETS}
        selectedSetId={previewSetId}
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
