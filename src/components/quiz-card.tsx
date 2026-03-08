import type { useQuiz } from '../hooks/use-quiz';
import type { RubyToken, UserPreferences } from '../types/quiz';
import { getDisplayMode } from '../lib/furigana';
import { ExplanationPanel } from './explanation-panel';

type Props = {
  quiz: ReturnType<typeof useQuiz>;
  preferences: UserPreferences;
};

function TextWithRuby({
  plain,
  ruby,
  showFurigana,
}: {
  plain: string;
  ruby?: RubyToken[];
  showFurigana: boolean;
}) {
  const content = getDisplayMode(plain, ruby, showFurigana);
  if (!content.ruby) return <>{content.text}</>;

  return (
    <>
      {content.ruby.map((token, index) => (
        <ruby key={`${token.base}-${index}`}>
          {token.base}
          {token.reading ? <rt>{token.reading}</rt> : null}
        </ruby>
      ))}
    </>
  );
}

export function QuizCard({ quiz, preferences }: Props) {
  const question = quiz.currentQuestion;
  if (!question) return null;

  const questionPlain = question.child_question_plain ?? question.question_plain;
  const questionRuby = question.child_question_ruby ?? question.question_ruby;
  const fontScaleStyle = { '--quiz-font-scale': `${preferences.fontScale / 100}` } as const;
  const progressCur = quiz.currentIndex + 1;
  const progressPct = quiz.total > 0 ? Math.min(100, (progressCur / quiz.total) * 100) : 0;

  return (
    <section class="panel quiz-panel" style={fontScaleStyle}>
      <div class="progress-wrap" role="progressbar" aria-label="Progress quiz" aria-valuenow={progressCur} aria-valuemin={0} aria-valuemax={quiz.total}>
        <div class="progress-track"><div class="progress-bar" style={{ width: `${progressPct}%` }} /></div>
        <small>{progressCur} / {quiz.total}</small>
      </div>

      <h2>Soal {question.numberLabel ?? question.number}</h2>

      {question.image && (
        <img
          src={question.image}
          alt={`Ilustrasi soal ${question.number}`}
          loading="lazy"
          class="question-image"
        />
      )}

      {question.isIllustrationChild && question.stem_plain && (
        <div class="question-stem">
          <small>Situasi</small>
          <p class="question-text">
            <TextWithRuby
              plain={question.stem_plain}
              ruby={question.stem_ruby}
              showFurigana={preferences.showFurigana}
            />
          </p>
        </div>
      )}

      <p class="question-text">
        <TextWithRuby
          plain={questionPlain}
          ruby={questionRuby}
          showFurigana={preferences.showFurigana}
        />
      </p>

      <div class="answer-buttons">
        <button type="button" disabled={!!quiz.currentAnswer} onClick={() => quiz.submitAnswer(true)} aria-label="Jawab benar">Benar (O)</button>
        <button type="button" disabled={!!quiz.currentAnswer} onClick={() => quiz.submitAnswer(false)} aria-label="Jawab salah">Salah (X)</button>
      </div>

      {quiz.currentAnswer && (
        <ExplanationPanel
          isCorrect={quiz.currentAnswer.isCorrect}
          userAnswer={quiz.currentAnswer.value}
          explanation={(
            <TextWithRuby
              plain={question.explanation_plain}
              ruby={question.explanation_ruby}
              showFurigana={preferences.showFurigana}
            />
          )}
          fontScale={preferences.fontScale}
          onNext={quiz.nextQuestion}
          isLast={quiz.currentIndex + 1 === quiz.total}
        />
      )}
    </section>
  );
}
