import kanjiN3 from "@/data/kanji.json";
import n3Goi from "@/data/n3_goi_myanmar_batch1.json";
import type { Card, Deck, DeckSummary } from "@/lib/types";

type RawCard = {
  kanji?: unknown;
  hiragana?: unknown;
  meaning?: unknown;
  meaning_mm?: unknown;
};

type DeckDefinition = {
  id: string;
  level: string;
  title: string;
  description: string;
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
 * Two file shapes are supported and can be mixed across decks:
 *   - A flat array: [{ "kanji": "…", "hiragana": "…", "meaning": "…" }]
 *   - A grouped object: { "nouns": [...], "verbs": [...], … } (e.g. goi decks),
 *     which is flattened in group order.
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
    description: "Vocabulary · Myanmar meanings",
    raw: n3Goi,
  },
];

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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

function normalizeCards(raw: unknown): Card[] {
  const occurrences = new Map<string, number>();

  return cardEntries(raw).flatMap((entry) => {
    const kanji = text(entry?.kanji);
    const hiragana = text(entry?.hiragana);
    const meaning = text(entry?.meaning) || text(entry?.meaning_mm);

    if (!kanji || !hiragana || !meaning) return [];

    // Kanji + reading keeps ids stable if the file is reordered, and avoids
    // collisions for future homographs with different readings.
    const base = `${kanji}·${hiragana}`;
    const occurrence = (occurrences.get(base) ?? 0) + 1;
    occurrences.set(base, occurrence);

    return [
      {
        id: occurrence === 1 ? base : `${base}#${occurrence}`,
        kanji,
        hiragana,
        meaning,
      },
    ];
  });
}

const DECKS: Deck[] = DEFINITIONS.map(({ raw, ...deck }) => ({
  ...deck,
  cards: normalizeCards(raw),
}));

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
