type Props = {
  setTitle: string;
  score: number;
  maxScore: number;
  onRestart: () => void;
};

export function ResultPanel({ setTitle, score, maxScore, onRestart }: Props) {
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return (
    <section class="panel">
      <h2>Hasil</h2>
      <p class="result-set">{setTitle}</p>
      <p>
        Skor: <strong>{score}</strong> / {maxScore} poin
      </p>
      <p class="result-percent">Akurasi: {percentage}%</p>
      <button type="button" onClick={onRestart}>
        Ulangi set
      </button>
    </section>
  );
}