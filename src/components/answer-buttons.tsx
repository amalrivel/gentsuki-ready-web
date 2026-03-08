type Props = {
  disabled?: boolean;
  onAnswer: (value: boolean) => void;
};

export function AnswerButtons({ disabled, onAnswer }: Props) {
  return (
    <div class="answer-buttons">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAnswer(true)}
        aria-label="Jawab benar"
      >
        Benar (O)
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAnswer(false)}
        aria-label="Jawab salah"
      >
        Salah (X)
      </button>
    </div>
  );
}