import type { QuizSetMeta } from '../types/quiz';

export const QUIZ_SETS: QuizSetMeta[] = [
  { id: 'genchare_1', title: 'Genchare 1', file: '/data/genchare_1.json' },
  { id: 'genchare_2', title: 'Genchare 2', file: '/data/genchare_2.json' },
  { id: 'genchare_3', title: 'Genchare 3', file: '/data/genchare_3.json' },
  { id: 'genchare_4', title: 'Genchare 4', file: '/data/genchare_4.json' },
];

export const STORAGE_KEYS = {
  progressPrefix: 'quiz-progress:',
  activeSet: 'quiz-active-set',
  progressVersion: 1,
};

export const UI_TEXT = {
  appTitle: 'Gentsuki Quiz',
  appSubtitle: 'Quiz benar/salah berbasis file statis, ringan, dan cepat.',
};