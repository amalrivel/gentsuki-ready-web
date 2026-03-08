import type { RubyToken } from '../types/quiz';

export function getDisplayMode(plain: string, ruby: RubyToken[] | undefined, showFurigana: boolean) {
  const text = plain.trim() || ruby?.map((t) => t.base).join('') || '';
  if (!showFurigana || !ruby?.length) return { text, ruby: undefined };
  return { text, ruby };
}
