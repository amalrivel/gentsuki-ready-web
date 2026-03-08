type Props = {
  message: string;
  onRetry: () => void;
};

export function ErrorView({ message, onRetry }: Props) {
  return (
    <section class="panel">
      <h2>Terjadi masalah</h2>
      <p>{message}</p>
      <button type="button" onClick={onRetry}>
        Coba lagi
      </button>
    </section>
  );
}