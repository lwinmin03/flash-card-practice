"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Flashcard from "@/components/Flashcard";
import GrammarFlashcard from "@/components/GrammarFlashcard";
import { cn } from "@/lib/cn";
import {
  getCardProgress,
  getDeckStats,
  useProgress,
  type CardStatus,
  type DeckStats,
  type ProgressStore,
} from "@/lib/progress";
import type { CardPrompt, Deck, StudyMode } from "@/lib/types";

type StudySessionProps = {
  deck: Deck;
  initialMode: StudyMode;
};

type SessionResults = Record<number, CardStatus>;

const primaryButton =
  "inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-semibold text-canvas transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:scale-[0.99]";

const secondaryButton =
  "inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-5 text-sm font-semibold text-ink transition hover:border-accent/40 hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:scale-[0.99]";

const iconButton =
  "grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-muted transition hover:border-accent/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:pointer-events-none disabled:opacity-40";

const PROMPT_STORAGE_PREFIX = "kanji-cards.prompt.";

function readPrompt(deckId: string, fallback: CardPrompt): CardPrompt {
  try {
    const stored = window.localStorage.getItem(PROMPT_STORAGE_PREFIX + deckId);
    return stored === "kanji" || stored === "hiragana" ? stored : fallback;
  } catch {
    return fallback;
  }
}

function savePrompt(deckId: string, prompt: CardPrompt) {
  try {
    window.localStorage.setItem(PROMPT_STORAGE_PREFIX + deckId, prompt);
  } catch {
    // Private mode or a full quota: the toggle still works for this session.
  }
}

function shuffled<T>(values: readonly T[]): T[] {
  const array = [...values];
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [array[index], array[swap]] = [array[swap], array[index]];
  }
  return array;
}

export default function StudySession({
  deck,
  initialMode,
}: StudySessionProps) {
  const { store, ready, mark } = useProgress();

  if (!ready) {
    return (
      <StudyFrame deck={deck} cursor={0} total={null}>
        <div
          role="status"
          className="flex flex-1 flex-col items-center justify-center gap-3 text-muted"
        >
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
          <span className="text-xs">Loading your progress…</span>
        </div>
      </StudyFrame>
    );
  }

  const allIndices = deck.cards.map((_, index) => index);
  const initialQueue =
    initialMode === "review"
      ? allIndices.filter(
          (index) =>
            getCardProgress(store, deck.id, deck.cards[index].id)?.status ===
            "review",
        )
      : allIndices;

  return (
    <Session
      key={`${deck.id}:${initialMode}`}
      deck={deck}
      initialMode={initialMode}
      initialQueue={initialQueue}
      store={store}
      mark={mark}
    />
  );
}

function Session({
  deck,
  initialMode,
  initialQueue,
  store,
  mark,
}: {
  deck: Deck;
  initialMode: StudyMode;
  initialQueue: number[];
  store: ProgressStore;
  mark: (deckId: string, cardId: string, status: CardStatus) => void;
}) {
  const [queue, setQueue] = useState<number[]>(initialQueue);
  const [cursor, setCursor] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<SessionResults>({});
  const [prompt, setPrompt] = useState<CardPrompt>(() =>
    readPrompt(deck.id, deck.defaultPrompt),
  );

  const cardIds = useMemo(() => deck.cards.map((card) => card.id), [deck.cards]);
  const stats = useMemo(
    () => getDeckStats(store, deck.id, cardIds),
    [store, deck.id, cardIds],
  );

  const finished = queue.length > 0 && cursor >= queue.length;
  const cardIndex = cursor < queue.length ? queue[cursor] : null;
  const currentCard = cardIndex === null ? null : deck.cards[cardIndex];
  const currentStatus = currentCard
    ? getCardProgress(store, deck.id, currentCard.id)?.status
    : undefined;

  const goNext = useCallback(() => {
    setFlipped(false);
    setCursor((value) => value + 1);
  }, []);

  const goPrev = useCallback(() => {
    setFlipped(false);
    setCursor((value) => Math.max(0, value - 1));
  }, []);

  const changePrompt = useCallback(
    (next: CardPrompt) => {
      setPrompt(next);
      setFlipped(false);
      savePrompt(deck.id, next);
    },
    [deck.id],
  );

  const grade = useCallback(
    (status: CardStatus) => {
      const targetIndex = queue[cursor];
      const target = deck.cards[targetIndex];
      if (!target) return;

      mark(deck.id, target.id, status);
      setResults((previous) => ({ ...previous, [targetIndex]: status }));
      setFlipped(false);
      setCursor((value) => value + 1);
    },
    [cursor, deck.cards, deck.id, mark, queue],
  );

  const restart = useCallback((cards: number[]) => {
    setQueue(cards);
    setCursor(0);
    setFlipped(false);
    setResults({});
  }, []);

  const shuffleRestart = useCallback(() => {
    restart(shuffled(queue));
  }, [queue, restart]);

  const reviewMissed = useCallback(() => {
    const missed = Object.entries(results)
      .filter(([, status]) => status === "review")
      .map(([index]) => Number(index));
    if (missed.length > 0) restart(missed);
  }, [restart, results]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (finished) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target;
      const interactive =
        target instanceof HTMLElement
          ? target.closest(
              "button, a, input, textarea, select, [role='button']",
            )
          : null;

      if (event.code === "Space" && !interactive) {
        event.preventDefault();
        setFlipped((value) => !value);
        return;
      }

      const key = event.key.toLowerCase();

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (flipped && (key === "a" || key === "1")) {
        event.preventDefault();
        grade("review");
      } else if (flipped && (key === "g" || key === "2")) {
        event.preventDefault();
        grade("known");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [finished, flipped, goNext, goPrev, grade]);

  return (
    <StudyFrame
      deck={deck}
      cursor={cursor}
      total={queue.length}
      onShuffle={queue.length > 0 ? shuffleRestart : undefined}
    >
      {queue.length === 0 ? (
        <EmptyState deck={deck} mode={initialMode} />
      ) : finished ? (
        <SessionComplete
          deck={deck}
          total={queue.length}
          results={results}
          stats={stats}
          onReviewMissed={reviewMissed}
          onStudyAgain={shuffleRestart}
        />
      ) : currentCard ? (
        <>
          <div className="mb-2 flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            <span>{initialMode === "review" ? "Review" : "Study"}</span>
            <span className="text-[11px] font-medium normal-case tracking-normal">
              {stats.known} learned · {stats.review} to review
            </span>
          </div>

          {deck.kind === "grammar" ? null : (
            <PromptSwitch value={prompt} onChange={changePrompt} />
          )}

          {currentCard.kind === "grammar" ? (
            <GrammarFlashcard
              key={currentCard.id}
              card={currentCard}
              level={deck.level}
              flipped={flipped}
              status={currentStatus}
              onToggle={() => setFlipped((value) => !value)}
            />
          ) : (
            <Flashcard
              key={currentCard.id}
              card={currentCard}
              level={deck.level}
              prompt={prompt}
              flipped={flipped}
              status={currentStatus}
              onToggle={() => setFlipped((value) => !value)}
            />
          )}

          <div className="mt-4 shrink-0">
            {flipped ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => grade("review")}
                  className="flex h-16 flex-col items-center justify-center rounded-2xl border border-accent/25 bg-accent-soft text-accent transition hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:scale-[0.98]"
                >
                  <span className="text-sm font-semibold">Again</span>
                  <span className="mt-0.5 text-[10px] font-medium opacity-70">
                    Needs practice
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => grade("known")}
                  className="flex h-16 flex-col items-center justify-center rounded-2xl bg-success text-canvas transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:scale-[0.98]"
                >
                  <span className="text-sm font-semibold">Got it</span>
                  <span className="mt-0.5 text-[10px] font-medium opacity-75">
                    Knew this one
                  </span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setFlipped(true)}
                className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-sm font-semibold text-canvas transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:scale-[0.99]"
              >
                Show answer
                <span className="hidden rounded-md border border-canvas/20 px-1.5 py-0.5 text-[10px] font-medium text-canvas/60 sm:inline">
                  Space
                </span>
              </button>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={goPrev}
              disabled={cursor === 0}
              className="inline-flex h-10 items-center gap-1 rounded-full px-2 text-xs font-medium text-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:pointer-events-none disabled:opacity-30"
            >
              <ArrowLeft />
              Prev
            </button>

            <span className="text-[11px] text-muted">
              {flipped ? "Grade yourself" : "Tap the card"}
            </span>

            <button
              type="button"
              onClick={goNext}
              className="inline-flex h-10 items-center gap-1 rounded-full px-2 text-xs font-medium text-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              Skip
              <ArrowRight />
            </button>
          </div>
        </>
      ) : null}
    </StudyFrame>
  );
}

function StudyFrame({
  deck,
  cursor,
  total,
  onShuffle,
  children,
}: {
  deck: Deck;
  cursor: number;
  total: number | null;
  onShuffle?: () => void;
  children: React.ReactNode;
}) {
  const percent =
    total !== null && total > 0 ? Math.min(100, (cursor / total) * 100) : 0;

  return (
    <div className="flex min-h-[100svh] flex-col">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-md items-center gap-2 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <Link href="/" aria-label="Back to decks" className={iconButton}>
            <ArrowLeft />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-semibold">{deck.title}</p>
              <p className="shrink-0 text-xs tabular-nums text-muted">
                {total === null || total === 0
                  ? "—"
                  : `${Math.min(cursor + 1, total)} / ${total}`}
              </p>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-line/70">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onShuffle}
            disabled={!onShuffle}
            title="Shuffle and restart from the first card"
            aria-label="Shuffle and restart from the first card"
            className={iconButton}
          >
            <ShuffleIcon />
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        {children}
      </main>
    </div>
  );
}

function PromptSwitch({
  value,
  onChange,
}: {
  value: CardPrompt;
  onChange: (prompt: CardPrompt) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Card direction"
      className="mb-3 grid grid-cols-2 gap-1 rounded-full border border-line bg-surface p-1"
    >
      <PromptOption
        active={value === "kanji"}
        label="漢字 → かな"
        description="Show kanji on the front, reading and meaning on the back"
        onClick={() => onChange("kanji")}
      />
      <PromptOption
        active={value === "hiragana"}
        label="かな → 漢字"
        description="Show hiragana on the front, kanji and meaning on the back"
        onClick={() => onChange("hiragana")}
      />
    </div>
  );
}

function PromptOption({
  active,
  label,
  description,
  onClick,
}: {
  active: boolean;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={description}
      title={description}
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-full text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        active
          ? "bg-ink text-canvas"
          : "text-muted hover:bg-canvas hover:text-ink",
      )}
    >
      <span aria-hidden="true" lang="ja" className="font-kanji">
        {label}
      </span>
    </button>
  );
}

function EmptyState({ deck, mode }: { deck: Deck; mode: StudyMode }) {
  const isReview = mode === "review";

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-success-soft text-success">
        <CheckIcon />
      </div>
      <h2 className="mt-5 text-xl font-semibold">
        {isReview ? "Nothing to review" : "No cards yet"}
      </h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
        {isReview
          ? "Cards you mark “Again” during a study session will collect here."
          : "Add cards to the JSON file to start studying."}
      </p>
      {isReview ? (
        <Link href={`/study/${deck.id}`} className={cn(primaryButton, "mt-6")}>
          Study full deck
        </Link>
      ) : null}
      <Link
        href="/"
        className="mt-4 text-sm font-medium text-muted underline underline-offset-4 transition hover:text-ink"
      >
        Back to decks
      </Link>
    </div>
  );
}

function SessionComplete({
  deck,
  total,
  results,
  stats,
  onReviewMissed,
  onStudyAgain,
}: {
  deck: Deck;
  total: number;
  results: SessionResults;
  stats: DeckStats;
  onReviewMissed: () => void;
  onStudyAgain: () => void;
}) {
  const graded = Object.keys(results).length;
  const known = Object.values(results).filter(
    (status) => status === "known",
  ).length;
  const missed = Object.values(results).filter(
    (status) => status === "review",
  ).length;
  const accuracy = graded === 0 ? 0 : Math.round((known / graded) * 100);

  return (
    <div className="animate-rise-in flex flex-1 flex-col justify-center py-6">
      <div className="text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success-soft text-success">
          <CheckIcon />
        </div>
        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">
          Session complete
        </p>
        <h2 className="mt-2 font-kanji text-3xl font-semibold">お疲れさま</h2>
        <p className="mt-2 text-sm text-muted">
          {graded === 0
            ? "You skipped through the deck without grading any cards."
            : `You graded ${graded} of ${total} cards this session.`}
        </p>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-line bg-surface p-4 text-center">
          <p className="text-2xl font-semibold tabular-nums text-success">
            {known}
          </p>
          <p className="mt-1 text-xs text-muted">Knew it</p>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-4 text-center">
          <p className="text-2xl font-semibold tabular-nums text-accent">
            {missed}
          </p>
          <p className="mt-1 text-xs text-muted">Needs review</p>
        </div>
      </div>

      <div className="mt-3 rounded-3xl border border-line bg-surface p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">Accuracy</span>
          <span className="font-semibold tabular-nums">{accuracy}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line/70">
          <div
            className="h-full rounded-full bg-success transition-[width] duration-500 ease-out"
            style={{ width: `${accuracy}%` }}
          />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          <span className="font-semibold text-ink">{stats.known}</span> of{" "}
          {stats.total} cards in {deck.title} are marked learned.
        </p>
      </div>

      <div className="mt-6 space-y-2">
        {missed > 0 ? (
          <button
            type="button"
            onClick={onReviewMissed}
            className={primaryButton}
          >
            Review {missed} missed
          </button>
        ) : null}

        <button
          type="button"
          onClick={onStudyAgain}
          className={missed > 0 ? secondaryButton : primaryButton}
        >
          Shuffle &amp; study again
        </button>

        <Link
          href="/"
          className="inline-flex h-11 w-full items-center justify-center rounded-2xl text-sm font-medium text-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          Back to decks
        </Link>
      </div>
    </div>
  );
}

function ArrowLeft() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15.5 10h-11M9 4.5 3.5 10 9 15.5" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 10h11M11 4.5l5.5 5.5-5.5 5.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

function ShuffleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.8-1.1 2-1.7 3.3-1.7H22" />
      <path d="m18 2 4 4-4 4" />
      <path d="M2 6h1.4c1.3 0 2.5.6 3.3 1.7l.6.8" />
      <path d="M22 18h-5.9c-1.3 0-2.5-.6-3.3-1.7l-.6-.8" />
      <path d="m18 14 4 4-4 4" />
    </svg>
  );
}
