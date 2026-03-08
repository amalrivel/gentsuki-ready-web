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

function createShuffleSeed(): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return crypto.getRandomValues(new Uint32Array(1))[0];
  }
  return Math.floor(Date.now()) >>> 0;
}

export function useQuiz(selectedSet: QuizSetMeta | null) {
  const [status, setStatus] = useState<QuizStatus>('idle');
  const [quizSet, setQuizSet] = useState<QuizSetFile | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [shuffleSeed, setShuffleSeed] = useState<number | null>(null);
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
        setShuffleSeed(null);
        setErrorMessage(null);
        return;
      }

      try {
        setStatus('loading');
        setErrorMessage(null);

        const saved = loadProgress(selectedSet.id);
        const nextShuffleSeed = saved?.shuffleSeed ?? createShuffleSeed();
        const data = await loadQuizSet(selectedSet, { shuffleSeed: nextShuffleSeed });
        if (cancelled) return;

        setQuizSet(data);
        setShuffleSeed(nextShuffleSeed);
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
    if (!selectedSet || !quizSet || shuffleSeed == null) return;

    saveProgress({
      version: STORAGE_KEYS.progressVersion,
      setId: selectedSet.id,
      currentIndex,
      answers,
      updatedAt: Date.now(),
      shuffleSeed,
    });
  }, [selectedSet, quizSet, currentIndex, answers, shuffleSeed]);

  const questions = quizSet?.questions ?? [];
  const currentQuestion = currentIndex < questions.length ? questions[currentIndex] : null;
  const total = questions.length;

  const answerMap = useMemo(() => buildAnswerMap(answers), [answers]);

  const questionMap = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);

  const groupMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const q of questions) {
      if (q.groupId) {
        const arr = map.get(q.groupId) ?? [];
        arr.push(q.id);
        map.set(q.groupId, arr);
      }
    }
    return map;
  }, [questions]);

  const maxScore = useMemo(() => {
    const seen = new Set<string>();
    let max = 0;
    for (const q of questions) {
      if (q.groupId) {
        if (!seen.has(q.groupId)) { seen.add(q.groupId); max += 2; }
      } else {
        max += 1;
      }
    }
    return max;
  }, [questions]);

  const score = useMemo(() => {
    const seen = new Set<string>();
    let total = 0;
    for (const answer of answers) {
      const q = questionMap.get(answer.questionId);
      if (!q) continue;
      if (q.groupId) {
        if (seen.has(q.groupId)) continue;
        seen.add(q.groupId);
        const allCorrect = (groupMap.get(q.groupId) ?? []).every(
          (qId) => answerMap.get(qId)?.isCorrect === true,
        );
        total += allCorrect ? 2 : 0;
      } else {
        total += answer.isCorrect ? 1 : 0;
      }
    }
    return total;
  }, [answers, questionMap, answerMap, groupMap]);

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
    setShuffleSeed(createShuffleSeed());
    setAnswers([]);
    setCurrentIndex(0);
    setErrorMessage(null);
    setReloadTick((prev) => prev + 1);
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
    maxScore,
    errorMessage,
    currentAnswer,
    submitAnswer,
    nextQuestion,
    restartQuiz,
    retryLoad,
  };
}
