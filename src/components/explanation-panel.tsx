type Props = {
  isCorrect: boolean;
  explanation: string;
  onNext: () => void;
  isLast: boolean;
};

export function ExplanationPanel({ isCorrect, explanation, onNext, isLast }: Props) {
  return (
    <div class="explanation-panel">
      <p class={isCorrect ? 'result-ok' : 'result-ng'}>
        <strong>{isCorrect ? 'Jawaban kamu benar.' : 'Jawaban kamu belum tepat.'}</strong>
      </p>

      <p class="explanation-text">{explanation || 'Belum ada pembahasan untuk soal ini.'}</p>

      <button type="button" onClick={onNext}>
        {isLast ? 'Lihat hasil' : 'Soal berikutnya'}
      </button>
    </div>
  );
}