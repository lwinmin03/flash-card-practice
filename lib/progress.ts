"use client";

import { useCallback, useSyncExternalStore } from "react";

export type CardStatus = "known" | "review";

export type CardProgress = {
  status: CardStatus;
  seen: number;
  updatedAt: number;
};

export type ProgressStore = {
  version: 1;
  cards: Record<string, CardProgress>;
};

export type DeckStats = {
  total: number;
  known: number;
  review: number;
  unseen: number;
  percent: number;
};

const STORAGE_KEY = "kanji-cards.progress.v1";
const CHANGE_EVENT = "kanji-cards:progress-change";
const EMPTY_STORE: ProgressStore = { version: 1, cards: {} };

let cachedRaw: string | null | undefined;
let cachedStore: ProgressStore = EMPTY_STORE;

function recordKey(deckId: string, cardId: string) {
  return `${deckId}::${cardId}`;
}

function parseStore(raw: string | null): ProgressStore {
  if (!raw) return EMPTY_STORE;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("cards" in parsed) ||
      typeof parsed.cards !== "object" ||
      parsed.cards === null
    ) {
      return EMPTY_STORE;
    }

    const cards: Record<string, CardProgress> = {};
    for (const [key, value] of Object.entries(parsed.cards)) {
      if (!value || typeof value !== "object") continue;
      const candidate = value as Partial<CardProgress>;
      if (candidate.status !== "known" && candidate.status !== "review") continue;

      cards[key] = {
        status: candidate.status,
        seen: typeof candidate.seen === "number" ? candidate.seen : 1,
        updatedAt:
          typeof candidate.updatedAt === "number" ? candidate.updatedAt : 0,
      };
    }

    return { version: 1, cards };
  } catch {
    return EMPTY_STORE;
  }
}

function getSnapshot(): ProgressStore {
  if (typeof window === "undefined") return EMPTY_STORE;

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return cachedStore;
  }

  if (raw === cachedRaw) return cachedStore;

  cachedRaw = raw;
  cachedStore = parseStore(raw);
  return cachedStore;
}

function getServerSnapshot(): ProgressStore {
  return EMPTY_STORE;
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  function onStorage(event: StorageEvent) {
    if (event.key === null || event.key === STORAGE_KEY) onStoreChange();
  }

  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

function persist(next: ProgressStore) {
  let raw: string | null = null;

  try {
    raw = JSON.stringify(next);
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      raw = null;
    }
  }

  cachedRaw = raw;
  cachedStore = next;

  try {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Ignore environments without custom events.
  }
}

function subscribeHydration() {
  return () => {};
}

function getHydratedSnapshot() {
  return true;
}

function getHydratedServerSnapshot() {
  return false;
}

export function getCardProgress(
  store: ProgressStore,
  deckId: string,
  cardId: string,
): CardProgress | undefined {
  return store.cards[recordKey(deckId, cardId)];
}

export function getDeckStats(
  store: ProgressStore,
  deckId: string,
  cardIds: string[],
): DeckStats {
  let known = 0;
  let review = 0;

  for (const cardId of cardIds) {
    const status = store.cards[recordKey(deckId, cardId)]?.status;
    if (status === "known") known += 1;
    else if (status === "review") review += 1;
  }

  const total = cardIds.length;
  return {
    total,
    known,
    review,
    unseen: Math.max(0, total - known - review),
    percent: total === 0 ? 0 : Math.round((known / total) * 100),
  };
}

export function useProgress() {
  const store = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  // False during SSR and hydration, true once the client is live. This lets
  // the UI hold back until localStorage has been read without an effect.
  const ready = useSyncExternalStore(
    subscribeHydration,
    getHydratedSnapshot,
    getHydratedServerSnapshot,
  );

  const mark = useCallback(
    (deckId: string, cardId: string, status: CardStatus) => {
      const current = getSnapshot();
      const key = recordKey(deckId, cardId);
      const previous = current.cards[key];

      persist({
        version: 1,
        cards: {
          ...current.cards,
          [key]: {
            status,
            seen: (previous?.seen ?? 0) + 1,
            updatedAt: Date.now(),
          },
        },
      });
    },
    [],
  );

  const clearDeck = useCallback((deckId: string) => {
    const current = getSnapshot();
    const prefix = `${deckId}::`;
    const cards = Object.fromEntries(
      Object.entries(current.cards).filter(
        ([key]) => !key.startsWith(prefix),
      ),
    );

    persist({ version: 1, cards });
  }, []);

  return { store, ready, mark, clearDeck };
}
