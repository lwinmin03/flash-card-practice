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
  /** The front text. For kana-only decks this is the katakana word. */
  kanji: string;
  /** Reading, or an empty string for kana-only decks. */
  hiragana: string;
  meaning: string;
  /** Optional English gloss shown above the main meaning. */
  meaningEn?: string;
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

export type SimilarMeaning = {
  word: string;
  meaning: string;
};

/** A comparison card pairing two words with close or related meanings. */
export type SimilarCard = {
  kind: "similar";
  /** Stable id used for local progress tracking. */
  id: string;
  left: SimilarMeaning;
  right: SimilarMeaning;
};

export type Card = WordCard | GrammarCard | SimilarCard;

export type DeckKind = "vocabulary" | "grammar" | "similar";

export type Deck = {
  id: string;
  level: string;
  title: string;
  description: string;
  kind: DeckKind;
  /** Direction a vocabulary deck starts in; the study screen can switch it. */
  defaultPrompt: CardPrompt;
  /**
   * True for decks whose front text has no kanji/reading pair (e.g. katakana
   * loanwords). Hides the prompt switch and shows only meanings on the backs.
   */
  kanaOnly: boolean;
  cards: Card[];
};

export type DeckSummary = Omit<Deck, "cards"> & {
  cardIds: string[];
  total: number;
};

export type StudyMode = "all" | "review";
