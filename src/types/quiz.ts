export type RubyToken = {
  base: string;
  reading?: string | null;
};

export type QuizQuestionType = 'standard' | 'illustration' | (string & {});

export type QuizQuestion = {
  id: string;
  type: QuizQuestionType;
  number: number;
  answer: boolean;
  question_plain: string;
  explanation_plain: string;
  image?: string;
  question_ruby?: RubyToken[];
  explanation_ruby?: RubyToken[];
};

export type QuizSetFile = {
  set_id: string;
  title: string;
  questions: QuizQuestion[];
};

export type QuizSetMeta = {
  id: string;
  title: string;
  file: string;
};

export type QuizStatus = 'idle' | 'loading' | 'ready' | 'finished' | 'error';

export type UserAnswer = {
  questionId: string;
  value: boolean;
  isCorrect: boolean;
};

export type QuizProgress = {
  version: number;
  setId: string;
  currentIndex: number;
  answers: UserAnswer[];
  updatedAt: number;
};

export type RawRubyToken = {
  base?: unknown;
  reading?: unknown;
};

export type RawQuizQuestion = {
  type?: unknown;
  number?: unknown;
  answer?: unknown;
  question_plain?: unknown;
  explanation_plain?: unknown;
  image?: unknown;
  question_ruby?: unknown;
  explanation_ruby?: unknown;
};

export type RawQuizSetObject = {
  set_id?: unknown;
  title?: unknown;
  questions?: unknown;
};