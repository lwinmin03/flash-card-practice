"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import {
  getDeckStats,
  useProgress,
  type DeckStats,
} from "@/lib/progress";
import type { DeckSummary } from "@/lib/types";

const RING_SIZE = 2 * Math.PI * 16.5;

type HomeProps = {
  decks: DeckSummary[];
};

export default function Home({ decks }: HomeProps) {
  const { store, ready, clearDeck } = useProgress();
  const [resetArmed, setResetArmed] = useState(false);

  const deckStats = useMemo(
    () =>
      decks.map((deck) => ({
        deck,
        stats: getDeckStats(store, deck.id, deck.cardIds),
      })),
    [decks, store],
  );

  const overall = deckStats.reduce(
    (total, entry) => ({
      known: total.known + entry.stats.known,
      review: total.review + entry.stats.review,
      total: total.total + entry.stats.total,
    }),
    { known: 0, review: 0, total: 0 },
  );

  const percent =
    overall.total === 0 ? 0 : Math.round((overall.known / overall.total) * 100);
  const unseen = Math.max(0, overall.total - overall.known - overall.review);
  const hasProgress = overall.known + overall.review > 0;

  useEffect(() => {
    if (!resetArmed) return;
    const timeout = window.setTimeout(() => setResetArmed(false), 4000);
    return () => window.clearTimeout(timeout);
  }, [resetArmed]);

  function resetProgress() {
    if (!resetArmed) {
      setResetArmed(true);
      return;
    }

    for (const deck of decks) clearDeck(deck.id);
    setResetArmed(false);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] sm:pt-14 lg:max-w-6xl lg:px-8 lg:pb-16 lg:pt-16">
      <div className="flex-1 lg:grid lg:grid-cols-[19rem_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[21rem_minmax(0,1fr)] xl:gap-14">
        <aside className="lg:sticky lg:top-12">
          <header className="animate-rise-in">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ink font-kanji text-xl text-canvas shadow-sm lg:h-12 lg:w-12 lg:text-2xl"
                >
                  漢
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">
                    Japanese practice
                  </p>
                  <h1 className="mt-0.5 text-2xl font-semibold tracking-tight lg:text-3xl">
                    Kanji Cards
                  </h1>
                </div>
              </div>

              {decks.length === 1 ? (
                <span className="mt-1 rounded-full border border-line bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  {decks[0].level}
                </span>
              ) : null}
            </div>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              One card at a time. Recall the reading, reveal the answer, and
              keep the ones that need another pass.
            </p>
          </header>

          <section
            aria-label="Overall progress"
            className="animate-rise-in mt-6 rounded-[1.75rem] bg-ink p-5 text-canvas shadow-xl shadow-black/10 [animation-delay:60ms] lg:mt-8"
          >
            <div className="flex items-center gap-5">
              <div className="relative h-[74px] w-[74px] shrink-0">
                <svg
                  viewBox="0 0 40 40"
                  className="h-full w-full -rotate-90"
                  aria-hidden="true"
                >
                  <circle
                    cx="20"
                    cy="20"
                    r="16.5"
                    fill="none"
                    strokeWidth="3"
                    className="stroke-canvas/15"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16.5"
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={RING_SIZE}
                    strokeDashoffset={
                      ready ? RING_SIZE * (1 - percent / 100) : RING_SIZE
                    }
                    className="stroke-accent-soft transition-[stroke-dashoffset] duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <span className="text-lg font-semibold tabular-nums">
                    {ready ? `${percent}%` : "—"}
                  </span>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-canvas/55">
                  Overall progress
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {ready ? overall.known : "—"}
                  <span className="ml-1 text-sm font-normal text-canvas/60">
                    of {overall.total} learned
                  </span>
                </p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-canvas/65">
                  <span>
                    <span className="font-semibold text-canvas">
                      {ready ? overall.review : "—"}
                    </span>{" "}
                    to review
                  </span>
                  <span>
                    <span className="font-semibold text-canvas">
                      {ready ? unseen : "—"}
                    </span>{" "}
                    new
                  </span>
                </div>
              </div>
            </div>
          </section>

          <ProgressFooter
            className="mt-8 hidden pt-2 lg:block"
            hasProgress={hasProgress}
            resetArmed={resetArmed}
            onReset={resetProgress}
          />
        </aside>

        <div className="min-w-0">
          <div className="mt-8 flex items-end justify-between lg:mt-1">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
              Your decks
            </h2>
            <span className="text-xs text-muted">
              {decks.length} {decks.length === 1 ? "deck" : "decks"}
            </span>
          </div>

          <div className="mt-3 space-y-4 lg:grid lg:mt-4 lg:grid-cols-1 lg:gap-5 lg:space-y-0 xl:grid-cols-2">
            {deckStats.map(({ deck, stats }) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                stats={stats}
                ready={ready}
              />
            ))}
          </div>
        </div>
      </div>

      <ProgressFooter
        className="mt-auto pt-10 lg:hidden"
        hasProgress={hasProgress}
        resetArmed={resetArmed}
        onReset={resetProgress}
      />
    </main>
  );
}

function ProgressFooter({
  className,
  hasProgress,
  resetArmed,
  onReset,
}: {
  className?: string;
  hasProgress: boolean;
  resetArmed: boolean;
  onReset: () => void;
}) {
  return (
    <footer
      className={cn(
        "text-center text-xs leading-relaxed text-muted",
        className,
      )}
    >
      <p>Progress is saved on this device.</p>
      {hasProgress ? (
        <button
          type="button"
          onClick={onReset}
          aria-live="polite"
          className={cn(
            "mt-2 rounded-full px-3 py-1 underline underline-offset-4 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
            resetArmed
              ? "font-semibold text-accent no-underline"
              : "hover:text-ink",
          )}
        >
          {resetArmed ? "Tap again to reset all progress" : "Reset progress"}
        </button>
      ) : null}
    </footer>
  );
}

function DeckCard({
  deck,
  stats,
  ready,
}: {
  deck: DeckSummary;
  stats: DeckStats;
  ready: boolean;
}) {
  return (
    <article className="flex h-full flex-col rounded-[1.5rem] border border-line bg-surface p-5 shadow-sm shadow-black/[0.03] lg:rounded-[1.75rem] lg:p-6 lg:transition lg:hover:-translate-y-0.5 lg:hover:shadow-md">
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent-soft font-kanji text-lg font-semibold text-accent lg:h-16 lg:w-16 lg:text-xl"
        >
          {deck.kind === "grammar"
            ? "文法"
            : deck.kind === "similar"
              ? "同"
              : deck.level}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold tracking-tight">{deck.title}</h3>
          <p className="mt-0.5 text-sm text-muted">
            {deck.description} · {deck.total} cards
          </p>
        </div>

        <span className="mt-0.5 rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold tabular-nums text-muted">
          {ready ? `${stats.percent}%` : "—"}
        </span>
      </div>

      <div
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-line/70"
        role="progressbar"
        aria-label={`${deck.title} progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={ready ? stats.percent : 0}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
          style={{ width: ready ? `${stats.percent}%` : "0%" }}
        />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Learned" value={ready ? stats.known : null} tone="success" />
        <Stat
          label="To review"
          value={ready ? stats.review : null}
          tone="accent"
        />
        <Stat label="New" value={ready ? stats.unseen : null} />
      </dl>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2 lg:mt-auto lg:pt-5">
        <Link
          href={`/study/${deck.id}`}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-semibold text-canvas transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:scale-[0.99]"
        >
          Study deck
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
            <path d="M4 10h12M11 5l5 5-5 5" />
          </svg>
        </Link>

        {ready && stats.review > 0 ? (
          <Link
            href={`/study/${deck.id}?mode=review`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition hover:border-accent/40 hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 active:scale-[0.99]"
          >
            Review
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs tabular-nums text-accent">
              {stats.review}
            </span>
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-line/60 px-4 text-sm font-semibold text-muted/50"
          >
            Review
          </button>
        )}
      </div>
    </article>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | null;
  tone?: "success" | "accent";
}) {
  return (
    <div className="rounded-2xl bg-canvas/70 px-2 py-2.5 text-center">
      <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 text-base font-semibold tabular-nums",
          tone === "success" && "text-success",
          tone === "accent" && "text-accent",
        )}
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}
