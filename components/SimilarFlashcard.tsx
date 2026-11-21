"use client";

import StatusChip from "@/components/StatusChip";
import { cn } from "@/lib/cn";
import type { CardStatus } from "@/lib/progress";
import type { SimilarCard, SimilarMeaning } from "@/lib/types";

type SimilarFlashcardProps = {
  card: SimilarCard;
  level: string;
  flipped: boolean;
  status?: CardStatus;
  onToggle: () => void;
};

function wordSizeClass(word: string) {
  const length = Array.from(word).length;

  if (length <= 3) return "text-[clamp(2.1rem,10vw,3.25rem)]";
  if (length <= 5) return "text-[clamp(1.8rem,8.5vw,2.75rem)]";
  if (length <= 7) return "text-[clamp(1.5rem,7vw,2.25rem)]";
  return "text-[clamp(1.25rem,5.6vw,1.85rem)]";
}

export default function SimilarFlashcard({
  card,
  level,
  flipped,
  status,
  onToggle,
}: SimilarFlashcardProps) {
  const answer = `${card.left.word}: ${card.left.meaning}. ${card.right.word}: ${card.right.meaning}.`;

  return (
    <div className="animate-card-in relative min-h-[240px] flex-1">
      <div className="flip-scene absolute inset-0">
        <button
          type="button"
          onClick={onToggle}
          aria-label={
            flipped
              ? `Hide the meanings for ${card.left.word} and ${card.right.word}`
              : `Reveal the meanings for ${card.left.word} and ${card.right.word}`
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
                  {level}
                </span>
                <StatusChip status={status} />
              </div>

              <div className="flex flex-1 flex-col items-center justify-center gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                  Compare the pair
                </span>

                <div className="flex w-full flex-col items-center gap-2">
                  <span
                    lang="ja"
                    className={cn(
                      "max-w-full px-2 text-center font-kanji leading-tight tracking-tight text-ink [overflow-wrap:anywhere]",
                      wordSizeClass(card.left.word),
                    )}
                  >
                    {card.left.word}
                  </span>
                  <span
                    aria-hidden="true"
                    className="rounded-full border border-line bg-canvas px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted"
                  >
                    vs
                  </span>
                  <span
                    lang="ja"
                    className={cn(
                      "max-w-full px-2 text-center font-kanji leading-tight tracking-tight text-ink [overflow-wrap:anywhere]",
                      wordSizeClass(card.right.word),
                    )}
                  >
                    {card.right.word}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 pb-1 text-[11px] text-muted">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-accent"
                />
                Tap to compare
              </div>
            </div>

            <div
              aria-hidden={!flipped}
              className="flip-face flip-back card-paper flex flex-col rounded-[1.75rem] border border-line p-5 shadow-xl shadow-black/[0.07]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                  Pair meanings
                </span>
                <StatusChip status={status} />
              </div>

              <div className="flex-1 overflow-y-auto py-3">
                <div className="flex min-h-full flex-col justify-center gap-2.5">
                  <MeaningBlock side={card.left} />
                  <p
                    aria-hidden="true"
                    className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-muted"
                  >
                    same meaning
                  </p>
                  <MeaningBlock side={card.right} />
                </div>
              </div>

              <div className="pb-1 text-center text-[11px] text-muted">
                Tap to flip back
              </div>
            </div>
          </div>
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        {flipped ? `Answer: ${answer}` : "Answer hidden."}
      </p>
    </div>
  );
}

function MeaningBlock({ side }: { side: SimilarMeaning }) {
  return (
    <div className="rounded-2xl bg-canvas/70 px-4 py-3 text-center">
      <p
        lang="ja"
        className="font-kanji text-[clamp(1.15rem,5vw,1.5rem)] font-semibold leading-tight text-accent [overflow-wrap:anywhere]"
      >
        {side.word}
      </p>
      <p
        lang="my"
        className="mt-1 font-myanmar text-[clamp(0.9rem,4vw,1.05rem)] leading-relaxed text-ink"
      >
        {side.meaning}
      </p>
    </div>
  );
}
