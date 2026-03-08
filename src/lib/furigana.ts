import type { RubyToken } from '../types/quiz';

export function hasRuby(tokens?: RubyToken[]): boolean {
  return Array.isArray(tokens) && tokens.length > 0;
}

export function rubyToPlain(tokens?: RubyToken[]): string {
  if (!tokens?.length) return '';
  return tokens.map((token) => token.base).join('');
}

export function getDisplayText(plain: string, ruby?: RubyToken[]): string {
  if (plain.trim()) return plain;
  return rubyToPlain(ruby);
}

export function toRubySegments(tokens?: RubyToken[]): Array<{ base: string; reading?: string | null }> {
  if (!tokens?.length) return [];
  return tokens.map((token) => ({ base: token.base, reading: token.reading }));
}