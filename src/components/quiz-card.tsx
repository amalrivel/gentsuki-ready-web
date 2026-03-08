import type { useQuiz } from '../hooks/use-quiz';
import { getDisplayText } from '../lib/furigana';
import { AnswerButtons } from './answer-buttons';
import { ProgressBar } from './progress-bar';
import { ExplanationPanel } from './explanation-panel';

type Props = {
  quiz: ReturnType<typeof useQuiz>;
};

export function QuizCard({ quiz }: Props) {
  const question = quiz.currentQuestion;
  if (!question) return null;

  return (
    <section class="panel">
      <ProgressBar current={quiz.currentIndex + 1} total={quiz.total} />

      <h2>Soal {question.number}</h2>

      {question.image && (
        <img
          src={question.image}
          alt={`Ilustrasi soal ${question.number}`}
          loading="lazy"
          class="question-image"
        />
      )}

      <p class="question-text">{getDisplayText(question.question_plain, question.question_ruby)}</p>

      <AnswerButtons
        disabled={!!quiz.currentAnswer}
        onAnswer={quiz.submitAnswer}
      />

      {quiz.currentAnswer && (
        <ExplanationPanel
          isCorrect={quiz.currentAnswer.isCorrect}
          explanation={getDisplayText(
            question.explanation_plain,
            question.explanation_ruby,
          )}
          onNext={quiz.nextQuestion}
          isLast={quiz.currentIndex + 1 === quiz.total}
        />
      )}
    </section>
  );
}