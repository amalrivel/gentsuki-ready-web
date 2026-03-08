import type { ComponentChildren } from 'preact';

type Props = {
  isCorrect: boolean;
  userAnswer: boolean;
  explanation: ComponentChildren;
  fontScale: number;
  onNext: () => void;
  isLast: boolean;
};

export function ExplanationPanel({ isCorrect, userAnswer, explanation, fontScale, onNext, isLast }: Props) {
  return (
    <div class="explanation-panel">
      <div class={isCorrect ? 'result-banner result-ok' : 'result-banner result-ng'}>
        <span class="result-icon">{isCorrect ? '○' : '✕'}</span>
        <div class="result-details">
          <strong class="result-title">{isCorrect ? 'Jawaban Benar!' : 'Jawaban Belum Tepat'}</strong>
          <span class="user-answer-label">Jawaban kamu: <strong>{userAnswer ? 'Benar (○)' : 'Salah (✕)'}</strong></span>
        </div>
      </div>

      <div
        class="explanation-body"
        style={{ '--quiz-font-scale': `${fontScale / 100}` } as const}
      >
        <p class="explanation-heading">Pembahasan</p>
        <p class="explanation-text">
          {explanation || 'Belum ada pembahasan untuk soal ini.'}
        </p>
      </div>

      <button type="button" class="btn-next" onClick={onNext}>
        {isLast ? 'Lihat hasil' : 'Soal berikutnya →'}
      </button>
    </div>
  );
}
