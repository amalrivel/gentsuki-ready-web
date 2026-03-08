import type {
  QuizQuestion,
  QuizSetFile,
  QuizSetMeta,
  RawQuizQuestion,
  RawQuizSetObject,
  RawRubyToken,
  RubyToken,
} from '../types/quiz';

// Legacy string symbols kept as fallback for older files
const ANSWER_TRUE_STRINGS = new Set(['O', '〇']);

type LoadQuizOptions = {
  shuffleSeed: number;
};

type ExpandedRaw = RawQuizQuestion & { _groupId?: string; _subLabel?: string };

function createSeededRandom(seed: number): () => number {
  let state = (Math.floor(seed) >>> 0) || 1;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const list = [...items];
  const random = createSeededRandom(seed);

  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }

  return list;
}

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
  // Primary format: native boolean (current data format)
  if (value === true) return true;
  if (value === false) return false;

  // Legacy fallback: string symbols from older data files
  if (typeof value === 'string') {
    return ANSWER_TRUE_STRINGS.has(value.trim());
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

function normalizeQuestion(raw: ExpandedRaw, index: number, setId: string): QuizQuestion {
  const number = toPositiveInt(raw.number, index + 1);
  const questionPlain = toStringSafe(raw.question_plain).trim();
  const explanationPlain = toStringSafe(raw.explanation_plain).trim();
  const stemPlain = toStringSafe(raw.stem_plain).trim();
  const childQuestionPlain = toStringSafe(raw.child_question_plain).trim();
  const isIllustrationChild = raw.is_illustration_child === true;

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
    stem_plain: stemPlain || undefined,
    stem_ruby: normalizeRubyTokens(raw.stem_ruby),
    child_question_plain: childQuestionPlain || undefined,
    child_question_ruby: normalizeRubyTokens(raw.child_question_ruby),
    isIllustrationChild,
    groupId: raw._groupId,
    numberLabel: raw._subLabel,
  };
}

function expandEntries(items: unknown[]): ExpandedRaw[] {
  const expanded: ExpandedRaw[] = [];
  let groupCounter = 0;

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    const raw = item as RawQuizQuestion & {
      stem_plain?: unknown;
      stem_ruby?: unknown;
      image?: unknown;
      children?: unknown;
      number?: unknown;
    };

    if (!Array.isArray(raw.children)) {
      expanded.push(raw as ExpandedRaw);
      continue;
    }

    const groupId = `g${groupCounter++}`;
    const stem = toStringSafe(raw.stem_plain).trim();
    const stemRuby = raw.stem_ruby;
    const parentNumber = toPositiveInt(raw.number, expanded.length + 1);

    for (const child of raw.children) {
      if (!child || typeof child !== 'object') continue;

      const childRaw = child as RawQuizQuestion & { sub_number?: unknown; image?: unknown };
      const childQuestion = toStringSafe(childRaw.question_plain).trim();
      const rawSubNum = childRaw.sub_number;
      const subLabel = typeof rawSubNum === 'string' && rawSubNum.includes('-') ? rawSubNum : undefined;

      expanded.push({
        type: 'illustration',
        number: toPositiveInt(rawSubNum, parentNumber),
        _subLabel: subLabel,
        answer: childRaw.answer,
        question_plain: childQuestion,
        child_question_plain: childQuestion,
        child_question_ruby: childRaw.question_ruby,
        stem_plain: stem,
        stem_ruby: stemRuby,
        is_illustration_child: true,
        explanation_plain: toStringSafe(childRaw.explanation_plain),
        image: childRaw.image ?? raw.image,
        question_ruby: childRaw.question_ruby,
        explanation_ruby: childRaw.explanation_ruby,
        _groupId: groupId,
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

export async function loadQuizSet(meta: QuizSetMeta, options: LoadQuizOptions): Promise<QuizSetFile> {
  const response = await fetch(meta.file, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Gagal memuat set ${meta.id} (${response.status})`);
  }

  const raw: unknown = await response.json();
  const extracted = extractQuestions(raw);
  const normalizedItems = expandEntries(extracted.items);

  const questions = normalizedItems
    .filter((item): item is ExpandedRaw => !!item && typeof item === 'object')
    .filter((item) => typeof item.answer === 'boolean' || typeof item.answer === 'string')
    .filter((item) => typeof item.question_plain === 'string' && typeof item.explanation_plain === 'string')
    .map((item, index) => normalizeQuestion(item, index, meta.id));

  if (questions.length === 0) {
    throw new Error(`Set ${meta.id} tidak memiliki soal.`);
  }

  // Build shuffle units: single questions stay solo, illustration children are grouped
  const unitMap = new Map<string, QuizQuestion[]>();
  const unitKeys: Array<QuizQuestion | string> = [];

  for (const q of questions) {
    if (q.groupId) {
      if (!unitMap.has(q.groupId)) {
        unitMap.set(q.groupId, []);
        unitKeys.push(q.groupId);
      }
      unitMap.get(q.groupId)!.push(q);
    } else {
      unitKeys.push(q);
    }
  }

  const units = unitKeys.map((key) =>
    typeof key === 'string' ? (unitMap.get(key) ?? []) : [key],
  );

  const shuffledUnits = shuffleWithSeed(units, options.shuffleSeed);

  const finalQuestions: QuizQuestion[] = [];
  for (const unit of shuffledUnits) {
    if (unit.length > 1 && unit[0].groupId) {
      const childSeed = hashString(`${options.shuffleSeed}:${unit[0].groupId}`);
      finalQuestions.push(...shuffleWithSeed(unit, childSeed));
    } else {
      finalQuestions.push(...unit);
    }
  }

  return {
    set_id: extracted.setId ?? meta.id,
    title: extracted.title ?? meta.title,
    questions: finalQuestions,
  };
}

function hashString(s: string): number {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 0x01000193) ^ s.charCodeAt(i)) >>> 0;
  }
  return h;
}
