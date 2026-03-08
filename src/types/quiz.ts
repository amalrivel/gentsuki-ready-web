export type RubyToken = {
  base: string;
  reading?: string | null;
};

export type UserPreferences = {
  showFurigana: boolean;
  fontScale: number;
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
  stem_plain?: string;
  stem_ruby?: RubyToken[];
  child_question_plain?: string;
  child_question_ruby?: RubyToken[];
  isIllustrationChild?: boolean;
  groupId?: string;
  numberLabel?: string;
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
  shuffleSeed?: number;
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
  stem_plain?: unknown;
  stem_ruby?: unknown;
  child_question_plain?: unknown;
  child_question_ruby?: unknown;
  is_illustration_child?: unknown;
};

export type RawQuizSetObject = {
  set_id?: unknown;
  title?: unknown;
  questions?: unknown;
};
