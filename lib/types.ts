/** Which field is shown on the front of a vocabulary card. */
export type CardPrompt = "kanji" | "hiragana";

export type GrammarExample = {
  japanese: string;
  /** Hiragana reading of `japanese`, when the source file provides one. */
  reading?: string;
  english?: string;
  /** Optional Myanmar translation. */
  myanmar?: string;
};

export type WordCard = {
  kind: "word";
  /** Stable id used for local progress tracking. */
  id: string;
  kanji: string;
  hiragana: string;
  meaning: string;
};

export type GrammarCard = {
  kind: "grammar";
  /** Stable id used for local progress tracking. */
  id: string;
  pattern: string;
  /** English explanation. */
  meaning: string;
  /** Optional Myanmar explanation. */
  meaningMm?: string;
  formation: string[];
  examples: GrammarExample[];
  notes?: string;
};

export type Card = WordCard | GrammarCard;

export type DeckKind = "vocabulary" | "grammar";

export type Deck = {
  id: string;
  level: string;
  title: string;
  description: string;
  kind: DeckKind;
  /** Direction a vocabulary deck starts in; the study screen can switch it. */
  defaultPrompt: CardPrompt;
  cards: Card[];
};

export type DeckSummary = Omit<Deck, "cards"> & {
  cardIds: string[];
  total: number;
};

export type StudyMode = "all" | "review";
