export type Card = {
  /** Stable id used for local progress tracking. */
  id: string;
  kanji: string;
  hiragana: string;
  meaning: string;
};

export type Deck = {
  id: string;
  level: string;
  title: string;
  description: string;
  cards: Card[];
};

export type DeckSummary = Omit<Deck, "cards"> & {
  cardIds: string[];
  total: number;
};

export type StudyMode = "all" | "review";
