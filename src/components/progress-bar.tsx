type Props = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: Props) {
  const ratio = total > 0 ? current / total : 0;
  const value = Math.min(100, Math.max(0, ratio * 100));

  return (
    <div class="progress-wrap" aria-label="Progress quiz" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={total}>
      <div class="progress-track">
        <div class="progress-bar" style={{ width: `${value}%` }} />
      </div>
      <small>
        {current} / {total}
      </small>
    </div>
  );
}