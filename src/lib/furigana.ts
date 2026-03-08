import type { RubyToken } from '../types/quiz';

function rubyToPlain(tokens?: RubyToken[]): string {
  if (!tokens?.length) return '';
  return tokens.map((token) => token.base).join('');
}

function getDisplayText(plain: string, ruby?: RubyToken[]): string {
  if (plain.trim()) return plain;
  return rubyToPlain(ruby);
}

function toRubySegments(tokens?: RubyToken[]): Array<{ base: string; reading?: string | null }> {
  if (!tokens?.length) return [];
  return tokens.map((token) => ({ base: token.base, reading: token.reading }));
}

export function getDisplayMode(plain: string, ruby: RubyToken[] | undefined, showFurigana: boolean) {
  const text = getDisplayText(plain, ruby);
  if (!showFurigana) return { text, ruby: undefined };

  const segments = toRubySegments(ruby);
  return segments.length > 0 ? { text, ruby: segments } : { text, ruby: undefined };
}
