import { useEffect, useMemo, useState } from 'preact/hooks';
import type { QuizSetFile, QuizSetMeta, QuizStatus, UserAnswer } from '../types/quiz';
import { loadQuizSet } from '../lib/quiz-loader';
import { clearProgress, loadProgress, saveProgress } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';

function clampIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(index, total));
}

function buildAnswerMap(answers: UserAnswer[]): Map<string, UserAnswer> {
  return new Map(answers.map((item) => [item.questionId, item]));
}

export function useQuiz(selectedSet: QuizSetMeta | null) {
  const [status, setStatus] = useState<QuizStatus>('idle');
  const [quizSet, setQuizSet] = useState<QuizSetFile | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!selectedSet) {
        setStatus('idle');
        setQuizSet(null);
        setCurrentIndex(0);
        setAnswers([]);
        setErrorMessage(null);
        return;
      }

      try {
        setStatus('loading');
        setErrorMessage(null);

        const data = await loadQuizSet(selectedSet);
        if (cancelled) return;

        setQuizSet(data);

        const saved = loadProgress(selectedSet.id);
        const validQuestionIds = new Set(data.questions.map((question) => question.id));

        const restoredAnswers = saved
          ? saved.answers.filter((item) => validQuestionIds.has(item.questionId))
          : [];
        const restoredIndex = saved
          ? clampIndex(saved.currentIndex, data.questions.length)
          : 0;

        setAnswers(restoredAnswers);
        setCurrentIndex(restoredIndex);

        const isFinished = restoredIndex >= data.questions.length;
        setStatus(isFinished ? 'finished' : 'ready');
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        setStatus('error');
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [selectedSet, reloadTick]);

  useEffect(() => {
    if (!selectedSet || !quizSet) return;

    saveProgress({
      version: STORAGE_KEYS.progressVersion,
      setId: selectedSet.id,
      currentIndex,
      answers,
      updatedAt: Date.now(),
    });
  }, [selectedSet, quizSet, currentIndex, answers]);

  const questions = quizSet?.questions ?? [];
  const currentQuestion = currentIndex < questions.length ? questions[currentIndex] : null;
  const total = questions.length;

  const score = useMemo(() => answers.filter((item) => item.isCorrect).length, [answers]);
  const answerMap = useMemo(() => buildAnswerMap(answers), [answers]);

  function submitAnswer(value: boolean) {
    if (!currentQuestion || status !== 'ready') return;

    const isAlreadyAnswered = answerMap.has(currentQuestion.id);
    if (isAlreadyAnswered) return;

    const next: UserAnswer = {
      questionId: currentQuestion.id,
      value,
      isCorrect: value === currentQuestion.answer,
    };

    setAnswers((prev) => [...prev, next]);
  }

  function nextQuestion() {
    if (!questions.length) return;
    if (!currentQuestion) return;

    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      setStatus('finished');
      setCurrentIndex(questions.length);
      return;
    }

    setCurrentIndex(nextIndex);
  }

  function restartQuiz() {
    if (!selectedSet) return;
    clearProgress(selectedSet.id);
    setAnswers([]);
    setCurrentIndex(0);
    setStatus('ready');
    setErrorMessage(null);
  }

  function retryLoad() {
    setReloadTick((prev) => prev + 1);
  }

  const currentAnswer = currentQuestion
    ? answerMap.get(currentQuestion.id)
    : undefined;

  return {
    status,
    quizSet,
    currentQuestion,
    currentIndex,
    total,
    answers,
    score,
    errorMessage,
    currentAnswer,
    submitAnswer,
    nextQuestion,
    restartQuiz,
    retryLoad,
  };
}