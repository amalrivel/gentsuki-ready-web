import type { QuizSetMeta } from '../types/quiz';

export const QUIZ_SETS: QuizSetMeta[] = [
  { id: 'genchare_1', title: 'Genchare 1', file: '/data/genchare_1.json' },
  { id: 'genchare_2', title: 'Genchare 2', file: '/data/genchare_2.json' },
  { id: 'genchare_3', title: 'Genchare 3', file: '/data/genchare_3.json' },
  { id: 'genchare_4', title: 'Genchare 4', file: '/data/genchare_4.json' },
  { id: 'menkyo_blog_1', title: 'Menkyo Blog 1', file: '/data/menkyo_blog_1.json' },
  { id: 'menkyo_blog_2', title: 'Menkyo Blog 2', file: '/data/menkyo_blog_2.json' },
  // { id: 'menkyo_blog_3', title: 'Menkyo Blog 3', file: '/data/menkyo_blog_3.json' },
  // { id: 'menkyo_blog_4', title: 'Menkyo Blog 4', file: '/data/menkyo_blog_4.json' },
  // { id: 'menkyo_blog_5', title: 'Menkyo Blog 5', file: '/data/menkyo_blog_5.json' },
  { id: 'book_1', title: 'Book 1', file: '/data/book_1.json' },
  { id: 'book_2', title: 'Book 2', file: '/data/book_2.json' },
  { id: 'book_3', title: 'Book 3', file: '/data/book_3.json' },

];

export const STORAGE_KEYS = {
  progressPrefix: 'quiz-progress:',
  activeSet: 'quiz-active-set',
  preferences: 'quiz-preferences',
  progressVersion: 1,
};

export const DEFAULT_PREFERENCES = {
  showFurigana: true,
  fontScale: 100,
} as const;

export const UI_TEXT = {
  appTitle: 'Gentsuki Ready Web',
};
