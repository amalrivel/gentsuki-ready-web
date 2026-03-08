type Props = {
  setTitle: string;
  score: number;
  total: number;
  onRestart: () => void;
};

export function ResultPanel({ setTitle, score, total, onRestart }: Props) {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <section class="panel">
      <h2>Hasil</h2>
      <p class="result-set">{setTitle}</p>
      <p>
        Skor: <strong>{score}</strong> / {total}
      </p>
      <p class="result-percent">Akurasi: {percentage}%</p>
      <button type="button" onClick={onRestart}>
        Ulangi set
      </button>
    </section>
  );
}