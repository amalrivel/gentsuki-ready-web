import type { ComponentChildren } from 'preact';

type Props = {
  isCorrect: boolean;
  explanation: ComponentChildren;
  fontScale: number;
  onNext: () => void;
  isLast: boolean;
};

export function ExplanationPanel({ isCorrect, explanation, fontScale, onNext, isLast }: Props) {
  return (
    <div class="explanation-panel">
      <p class={isCorrect ? 'result-ok' : 'result-ng'}>
        <strong>{isCorrect ? 'Jawaban kamu benar.' : 'Jawaban kamu belum tepat.'}</strong>
      </p>

      <p
        class="explanation-text"
        style={{ '--quiz-font-scale': `${fontScale / 100}` } as const}
      >
        {explanation || 'Belum ada pembahasan untuk soal ini.'}
      </p>

      <button type="button" onClick={onNext}>
        {isLast ? 'Lihat hasil' : 'Soal berikutnya'}
      </button>
    </div>
  );
}
