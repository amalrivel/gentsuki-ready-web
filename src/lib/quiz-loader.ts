import type {
  QuizQuestion,
  QuizSetFile,
  QuizSetMeta,
  RawQuizQuestion,
  RawQuizSetObject,
  RawRubyToken,
  RubyToken,
} from '../types/quiz';

const ANSWER_TRUE = new Set(['o', 'O', '〇']);
const ANSWER_FALSE = new Set(['x', 'X', '✕']);

function toStringSafe(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function toPositiveInt(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return fallback;
}

function normalizeAnswer(value: unknown): boolean {
  if (value === true) return true;
  if (value === false) return false;

  if (typeof value === 'string') {
    const normalized = value.trim();
    if (ANSWER_TRUE.has(normalized)) return true;
    if (ANSWER_FALSE.has(normalized)) return false;
  }

  return false;
}

function normalizeImagePath(image: unknown): string | undefined {
  if (typeof image !== 'string') return undefined;

  const name = image.trim();
  if (!name) return undefined;
  if (/^https?:\/\//i.test(name)) return name;
  if (name.startsWith('/images/')) return name;

  const clean = name.replace(/^\/+/, '').replace(/^images\//, '');
  return `/images/${clean}`;
}

function normalizeRubyTokens(tokens: unknown): RubyToken[] | undefined {
  if (!Array.isArray(tokens)) return undefined;

  const normalized = tokens
    .map((item): RubyToken | null => {
      if (!item || typeof item !== 'object') return null;

      const raw = item as RawRubyToken;
      const base = toStringSafe(raw.base).trim();
      if (!base) return null;

      const readingValue = raw.reading;
      const reading =
        typeof readingValue === 'string'
          ? readingValue
          : readingValue == null
            ? null
            : undefined;

      return { base, reading };
    })
    .filter((token): token is RubyToken => token !== null);

  return normalized.length > 0 ? normalized : undefined;
}

function normalizeQuestion(raw: RawQuizQuestion, index: number, setId: string): QuizQuestion {
  const number = toPositiveInt(raw.number, index + 1);
  const questionPlain = toStringSafe(raw.question_plain).trim();
  const explanationPlain = toStringSafe(raw.explanation_plain).trim();

  return {
    id: `${setId}-q-${number}-${index + 1}`,
    type: toStringSafe(raw.type, 'standard').trim() || 'standard',
    number,
    answer: normalizeAnswer(raw.answer),
    question_plain: questionPlain,
    explanation_plain: explanationPlain,
    image: normalizeImagePath(raw.image),
    question_ruby: normalizeRubyTokens(raw.question_ruby),
    explanation_ruby: normalizeRubyTokens(raw.explanation_ruby),
  };
}

function expandEntries(items: unknown[]): RawQuizQuestion[] {
  const expanded: RawQuizQuestion[] = [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    const raw = item as RawQuizQuestion & {
      stem_plain?: unknown;
      image?: unknown;
      children?: unknown;
      number?: unknown;
    };

    if (!Array.isArray(raw.children)) {
      expanded.push(raw);
      continue;
    }

    const stem = toStringSafe(raw.stem_plain).trim();
    const parentNumber = toPositiveInt(raw.number, expanded.length + 1);

    for (const child of raw.children) {
      if (!child || typeof child !== 'object') continue;

      const childRaw = child as RawQuizQuestion & { sub_number?: unknown; image?: unknown };
      const childQuestion = toStringSafe(childRaw.question_plain).trim();

      expanded.push({
        type: 'illustration',
        number: toPositiveInt(childRaw.sub_number, parentNumber),
        answer: childRaw.answer,
        question_plain: [stem, childQuestion].filter(Boolean).join(' ').trim(),
        explanation_plain: toStringSafe(childRaw.explanation_plain),
        image: childRaw.image ?? raw.image,
        question_ruby: childRaw.question_ruby,
        explanation_ruby: childRaw.explanation_ruby,
      });
    }
  }

  return expanded;
}

function extractQuestions(raw: unknown): { items: unknown[]; setId?: string; title?: string } {
  if (Array.isArray(raw)) {
    return { items: raw };
  }

  if (raw && typeof raw === 'object') {
    const wrapped = raw as RawQuizSetObject;
    if (Array.isArray(wrapped.questions)) {
      return {
        items: wrapped.questions,
        setId: toStringSafe(wrapped.set_id) || undefined,
        title: toStringSafe(wrapped.title) || undefined,
      };
    }
  }

  throw new Error('Format JSON quiz tidak valid. Diharapkan array atau object dengan questions[].');
}

export async function loadQuizSet(meta: QuizSetMeta): Promise<QuizSetFile> {
  const response = await fetch(meta.file, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Gagal memuat set ${meta.id} (${response.status})`);
  }

  const raw: unknown = await response.json();
  const extracted = extractQuestions(raw);
  const normalizedItems = expandEntries(extracted.items);

  const questions = normalizedItems
    .filter((item): item is RawQuizQuestion => !!item && typeof item === 'object')
    .filter((item) => typeof item.answer === 'string' || typeof item.answer === 'boolean')
    .filter((item) => typeof item.question_plain === 'string' && typeof item.explanation_plain === 'string')
    .map((item, index) => normalizeQuestion(item, index, meta.id));

  if (questions.length === 0) {
    throw new Error(`Set ${meta.id} tidak memiliki soal.`);
  }

  return {
    set_id: extracted.setId ?? meta.id,
    title: extracted.title ?? meta.title,
    questions,
  };
}