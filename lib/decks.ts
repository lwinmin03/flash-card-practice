import kanjiN3 from "@/data/kanji.json";
import grammarN3 from "@/data/n3_grammar_patterns_01_30.json";
import n3Goi from "@/data/n3_goi_myanmar_batch1.json";
import type {
  CardPrompt,
  Deck,
  DeckKind,
  DeckSummary,
  GrammarCard,
  GrammarExample,
  WordCard,
} from "@/lib/types";

type RawCard = {
  kanji?: unknown;
  word?: unknown;
  hiragana?: unknown;
  reading?: unknown;
  meaning?: unknown;
  meaning_mm?: unknown;
};

type RawGrammarEntry = {
  grammar?: unknown;
  pattern?: unknown;
  reading?: unknown;
  meaning?: unknown;
  meaning_en?: unknown;
  meaning_mm?: unknown;
  myanmar?: unknown;
  formation?: unknown;
  examples?: unknown;
  notes?: unknown;
};

type DeckDefinition = {
  id: string;
  level: string;
  title: string;
  description: string;
  /** Defaults to "vocabulary". */
  kind?: DeckKind;
  /** Front of a vocabulary card. Defaults to "kanji". */
  defaultPrompt?: CardPrompt;
  raw: unknown;
};

/**
 * Deck registry.
 *
 * To add another level later:
 *   1. Put the JSON file in `data/`.
 *   2. Import it at the top of this file.
 *   3. Add an entry to DEFINITIONS below.
 *
 * Supported file shapes:
 *   - Vocabulary flat array: [{ "kanji": "…", "hiragana": "…", "meaning": "…" }]
 *   - Vocabulary grouped object: { "nouns": [...], "verbs": [...], … }
 *     (e.g. goi decks), flattened in group order.
 *   - Grammar object: { "entries": [{ "grammar": "…", "meaning_en": "…",
 *     "formation": [...], "examples": [...], "notes": "…" }] }
 *
 * Meanings may use `meaning_mm` (or `myanmar` on examples) for Myanmar text.
 * Kana-only vocabulary (katakana, onomatopoeia) may use `word`/`reading`
 * instead of `kanji`/`hiragana`.
 *
 * The home screen and study routes pick it up automatically.
 */
const DEFINITIONS: DeckDefinition[] = [
  {
    id: "n3",
    level: "N3",
    title: "JLPT N3",
    description: "Kanji & vocabulary",
    raw: kanjiN3,
  },
  {
    id: "n3-goi",
    level: "N3",
    title: "JLPT N3 語彙",
    description: "Kanji ↔ Hiragana · Myanmar meanings",
    defaultPrompt: "hiragana",
    raw: n3Goi,
  },
  {
    id: "n3-grammar",
    level: "N3",
    title: "JLPT N3 文法",
    description: "Grammar patterns · formation & examples",
    kind: "grammar",
    raw: grammarN3,
  },
];

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(text).filter(Boolean);
}

/** Appends #2, #3, … to later duplicates so ids stay unique and stable. */
function uniqueId(occurrences: Map<string, number>, base: string): string {
  const occurrence = (occurrences.get(base) ?? 0) + 1;
  occurrences.set(base, occurrence);
  return occurrence === 1 ? base : `${base}#${occurrence}`;
}

/**
 * Accepts either a flat card array or a grouped object
 * ({ nouns: [...], verbs: [...], ... }), flattening groups in file order.
 */
function cardEntries(raw: unknown): RawCard[] {
  if (Array.isArray(raw)) return raw as RawCard[];
  if (!raw || typeof raw !== "object") return [];

  return Object.values(raw).flatMap((group) =>
    Array.isArray(group) ? (group as RawCard[]) : [],
  );
}

function normalizeCards(raw: unknown): WordCard[] {
  const occurrences = new Map<string, number>();

  return cardEntries(raw).flatMap((entry) => {
    // Katakana and onomatopoeia groups use `word`/`reading` instead of
    // `kanji`/`hiragana`; both shapes become the same flashcard.
    const kanji = text(entry?.kanji) || text(entry?.word);
    const hiragana = text(entry?.hiragana) || text(entry?.reading);
    const meaning = text(entry?.meaning) || text(entry?.meaning_mm);

    if (!kanji || !hiragana || !meaning) return [];

    // Kanji + reading keeps ids stable if the file is reordered, and avoids
    // collisions for future homographs with different readings.
    return [
      {
        kind: "word",
        id: uniqueId(occurrences, `${kanji}·${hiragana}`),
        kanji,
        hiragana,
        meaning,
      },
    ];
  });
}

function grammarEntries(raw: unknown): RawGrammarEntry[] {
  if (!raw || typeof raw !== "object") return [];

  const entries = (raw as { entries?: unknown }).entries;
  return Array.isArray(entries) ? (entries as RawGrammarEntry[]) : [];
}

function normalizeExamples(value: unknown): GrammarExample[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const example = item as Record<string, unknown>;
    const japanese = text(example.japanese);

    if (!japanese) return [];

    return [
      {
        japanese,
        reading: text(example.hiragana) || text(example.reading) || undefined,
        english: text(example.english) || undefined,
        myanmar:
          text(example.myanmar) || text(example.meaning_mm) || undefined,
      },
    ];
  });
}

function normalizeGrammar(raw: unknown): GrammarCard[] {
  const occurrences = new Map<string, number>();

  return grammarEntries(raw).flatMap((entry) => {
    const pattern = text(entry?.grammar) || text(entry?.pattern);
    const meaningMm = text(entry?.meaning_mm) || text(entry?.myanmar);
    const meaning =
      text(entry?.meaning_en) || text(entry?.meaning) || meaningMm;

    if (!pattern || !meaning) return [];

    return [
      {
        kind: "grammar",
        id: uniqueId(occurrences, pattern),
        pattern,
        meaning,
        meaningMm: meaningMm || undefined,
        formation: stringList(entry?.formation),
        examples: normalizeExamples(entry?.examples),
        notes: text(entry?.notes) || undefined,
      },
    ];
  });
}

const DECKS: Deck[] = DEFINITIONS.map(
  ({ raw, kind = "vocabulary", defaultPrompt = "kanji", ...deck }) => ({
    ...deck,
    kind,
    defaultPrompt,
    cards:
      kind === "grammar" ? normalizeGrammar(raw) : normalizeCards(raw),
  }),
);

const DECKS_BY_ID = new Map(DECKS.map((deck) => [deck.id, deck]));

export function getDecks(): Deck[] {
  return DECKS;
}

export function getDeck(id: string): Deck | undefined {
  return DECKS_BY_ID.get(id);
}

export function getDeckSummaries(): DeckSummary[] {
  return DECKS.map(({ cards, ...deck }) => ({
    ...deck,
    cardIds: cards.map((card) => card.id),
    total: cards.length,
  }));
}
