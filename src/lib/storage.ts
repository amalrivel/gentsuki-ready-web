import type { QuizProgress, UserAnswer } from '../types/quiz';
import { STORAGE_KEYS } from './constants';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function sanitizeAnswers(value: unknown): UserAnswer[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): UserAnswer | null => {
      if (!item || typeof item !== 'object') return null;

      const data = item as Partial<UserAnswer>;
      if (typeof data.questionId !== 'string') return null;
      if (typeof data.value !== 'boolean') return null;
      if (typeof data.isCorrect !== 'boolean') return null;

      return {
        questionId: data.questionId,
        value: data.value,
        isCorrect: data.isCorrect,
      };
    })
    .filter((item): item is UserAnswer => item !== null);
}

export function getProgressKey(setId: string) {
  return `${STORAGE_KEYS.progressPrefix}${setId}`;
}

export function saveProgress(data: QuizProgress) {
  if (!canUseStorage()) return;
  localStorage.setItem(getProgressKey(data.setId), JSON.stringify(data));
}

export function loadProgress(setId: string): QuizProgress | null {
  if (!canUseStorage()) return null;

  const raw = localStorage.getItem(getProgressKey(setId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<QuizProgress>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.version !== STORAGE_KEYS.progressVersion) return null;
    if (typeof parsed.setId !== 'string') return null;

    const currentIndex =
      typeof parsed.currentIndex === 'number' && Number.isFinite(parsed.currentIndex)
        ? Math.max(0, Math.floor(parsed.currentIndex))
        : 0;

    return {
      version: parsed.version,
      setId: parsed.setId,
      currentIndex,
      answers: sanitizeAnswers(parsed.answers),
      updatedAt:
        typeof parsed.updatedAt === 'number' && Number.isFinite(parsed.updatedAt)
          ? parsed.updatedAt
          : Date.now(),
    };
  } catch {
    return null;
  }
}

export function clearProgress(setId: string) {
  if (!canUseStorage()) return;
  localStorage.removeItem(getProgressKey(setId));
}

export function saveActiveSet(setId: string) {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEYS.activeSet, setId);
}

export function loadActiveSet(): string | null {
  if (!canUseStorage()) return null;
  const value = localStorage.getItem(STORAGE_KEYS.activeSet);
  return typeof value === 'string' && value.trim() ? value : null;
}