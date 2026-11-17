"use client";

import StatusChip from "@/components/StatusChip";
import { cn } from "@/lib/cn";
import type { CardStatus } from "@/lib/progress";
import type { GrammarCard } from "@/lib/types";

type GrammarFlashcardProps = {
  card: GrammarCard;
  level: string;
  flipped: boolean;
  status?: CardStatus;
  onToggle: () => void;
};

function patternSizeClass(pattern: string) {
  const length = Array.from(pattern).length;

  if (length <= 8) return "text-[clamp(2rem,10vw,3.25rem)]";
  if (length <= 16) return "text-[clamp(1.6rem,7.5vw,2.35rem)]";
  return "text-[clamp(1.3rem,6vw,1.85rem)]";
}

export default function GrammarFlashcard({
  card,
  level,
  flipped,
  status,
  onToggle,
}: GrammarFlashcardProps) {
  const firstExample = card.examples[0];

  return (
    <div className="animate-card-in relative min-h-[240px] flex-1">
      <div className="flip-scene absolute inset-0">
        <button
          type="button"
          onClick={onToggle}
          aria-label={
            flipped
              ? `Hide the meaning and examples for ${card.pattern}`
              : `Reveal the meaning and examples for ${card.pattern}`
          }
          aria-pressed={flipped}
          className="block h-full w-full rounded-[1.75rem] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-4 focus-visible:ring-offset-canvas"
        >
          <div className={cn("flip-card", flipped && "is-flipped")}>
            <div
              aria-hidden={flipped}
              className="flip-face card-paper flex flex-col rounded-[1.75rem] border border-line p-5 shadow-xl shadow-black/[0.07]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                  {level} · Grammar
                </span>
                <StatusChip status={status} />
              </div>

              <div className="relative flex flex-1 items-center justify-center">
                <div
                  aria-hidden="true"
                  className="absolute aspect-square h-[58%] max-h-64 rounded-full border border-line/80"
                />
                <div
                  aria-hidden="true"
                  className="absolute aspect-square h-[42%] max-h-48 rounded-full border border-accent/10"
                />
                <span
                  lang="ja"
                  className={cn(
                    "relative px-2 text-center font-kanji leading-snug tracking-tight text-ink [overflow-wrap:anywhere]",
                    patternSizeClass(card.pattern),
                  )}
                >
                  {card.pattern}
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 pb-1 text-[11px] text-muted">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-accent"
                />
                Tap for meaning &amp; examples
              </div>
            </div>

            <div
              aria-hidden={!flipped}
              className="flip-face flip-back card-paper flex flex-col rounded-[1.75rem] border border-line p-4 shadow-xl shadow-black/[0.07]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                  Meaning &amp; examples
                </span>
                <StatusChip status={status} />
              </div>

              <div className="mt-2 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
                <div>
                  {card.meaningMm ? (
                    <>
                      <p
                        lang="my"
                        className="font-myanmar text-[15px] leading-relaxed text-ink"
                      >
                        {card.meaningMm}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        {card.meaning}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm leading-relaxed text-ink">
                      {card.meaning}
                    </p>
                  )}
                </div>

                {card.formation.length > 0 ? (
                  <section>
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                      Formation
                    </h3>
                    <ul className="mt-1.5 space-y-1">
                      {card.formation.map((line) => (
                        <li
                          key={line}
                          lang="ja"
                          className="rounded-xl bg-canvas/70 px-2.5 py-1.5 text-[13px] leading-snug text-ink"
                        >
                          {line}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {card.examples.length > 0 ? (
                  <section>
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                      Examples
                    </h3>
                    <ul className="mt-1.5 space-y-2.5">
                      {card.examples.map((example) => (
                        <li
                          key={example.japanese}
                          className="rounded-xl border border-line/70 bg-canvas/40 px-3 py-2.5"
                        >
                          <p
                            lang="ja"
                            className="font-kanji text-[15px] leading-relaxed text-ink"
                          >
                            {example.japanese}
                          </p>
                          {example.reading ? (
                            <p
                              lang="ja"
                              className="mt-0.5 text-[11px] leading-relaxed text-muted"
                            >
                              {example.reading}
                            </p>
                          ) : null}
                          {example.english ? (
                            <p className="mt-1.5 text-xs leading-relaxed text-muted">
                              {example.english}
                            </p>
                          ) : null}
                          {example.myanmar ? (
                            <p
                              lang="my"
                              className="mt-1 font-myanmar text-xs leading-relaxed text-ink"
                            >
                              {example.myanmar}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {card.notes ? (
                  <p className="border-l-2 border-accent/40 pl-2.5 text-xs leading-relaxed text-muted">
                    {card.notes}
                  </p>
                ) : null}
              </div>

              <div className="pt-2 text-center text-[11px] text-muted">
                Tap to flip back
              </div>
            </div>
          </div>
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        {flipped
          ? `Answer: ${card.meaningMm ?? card.meaning}${
              firstExample ? `. Example: ${firstExample.japanese}` : ""
            }`
          : "Answer hidden."}
      </p>
    </div>
  );
}
