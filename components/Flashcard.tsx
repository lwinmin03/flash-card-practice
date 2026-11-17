"use client";

import { cn } from "@/lib/cn";
import StatusChip from "@/components/StatusChip";
import type { CardStatus } from "@/lib/progress";
import type { CardPrompt, WordCard } from "@/lib/types";

type FlashcardProps = {
  card: WordCard;
  level: string;
  prompt: CardPrompt;
  flipped: boolean;
  status?: CardStatus;
  onToggle: () => void;
};

function kanjiSizeClass(kanji: string) {
  const length = Array.from(kanji).length;

  if (length <= 1) return "text-[clamp(5rem,30vw,9rem)]";
  if (length === 2) return "text-[clamp(4rem,24vw,7.5rem)]";
  if (length === 3) return "text-[clamp(3.25rem,19vw,6.5rem)]";
  return "text-[clamp(2.75rem,15vw,5.25rem)]";
}

/**
 * Hiragana strings can be much longer than kanji (e.g. おかねをためる), so they
 * need a tighter scale to stay on one or two lines inside the card.
 */
function hiraganaSizeClass(hiragana: string) {
  const length = Array.from(hiragana).length;

  if (length <= 3) return "text-[clamp(3.25rem,18vw,5.5rem)]";
  if (length <= 5) return "text-[clamp(2.5rem,13vw,4rem)]";
  if (length <= 7) return "text-[clamp(2rem,10.5vw,3.25rem)]";
  return "text-[clamp(1.75rem,8.5vw,2.75rem)]";
}

export default function Flashcard({
  card,
  level,
  prompt,
  flipped,
  status,
  onToggle,
}: FlashcardProps) {
  const isHiraganaPrompt = prompt === "hiragana";
  const promptText = isHiraganaPrompt ? card.hiragana : card.kanji;
  const answer = isHiraganaPrompt
    ? `Kanji: ${card.kanji}. Meaning: ${card.meaning}`
    : `Reading: ${card.hiragana}. Meaning: ${card.meaning}`;

  return (
    <div className="animate-card-in relative min-h-[240px] flex-1">
      <div className="flip-scene absolute inset-0">
        <button
          type="button"
          onClick={onToggle}
          aria-label={
            flipped
              ? `Hide the answer for ${promptText}`
              : `Reveal the answer for ${promptText}`
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
                    "relative px-2 text-center font-kanji leading-tight tracking-tight text-ink [overflow-wrap:anywhere]",
                    isHiraganaPrompt
                      ? hiraganaSizeClass(promptText)
                      : kanjiSizeClass(promptText),
                  )}
                >
                  {promptText}
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 pb-1 text-[11px] text-muted">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-accent"
                />
                Tap to reveal
              </div>
            </div>

            <div
              aria-hidden={!flipped}
              className="flip-face flip-back card-paper flex flex-col rounded-[1.75rem] border border-line p-5 shadow-xl shadow-black/[0.07]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                  {isHiraganaPrompt ? "Kanji & meaning" : "Reading & meaning"}
                </span>
                <StatusChip status={status} />
              </div>

              <div className="flex-1 overflow-y-auto py-3">
                <div className="flex min-h-full flex-col items-center justify-center gap-4 px-1 text-center">
                  {isHiraganaPrompt ? (
                    <span
                      lang="ja"
                      className="font-kanji text-[clamp(1.8rem,8vw,2.75rem)] leading-tight text-accent"
                    >
                      {card.kanji}
                    </span>
                  ) : (
                    <>
                      <span
                        lang="ja"
                        className="font-kanji text-2xl leading-none text-muted"
                      >
                        {card.kanji}
                      </span>
                      <span
                        lang="ja"
                        className="font-kanji text-[clamp(1.6rem,7vw,2.4rem)] leading-tight text-accent"
                      >
                        {card.hiragana}
                      </span>
                    </>
                  )}
                  <span aria-hidden="true" className="h-px w-14 bg-line" />
                  <span
                    lang="my"
                    className="font-myanmar text-[clamp(1.05rem,4.8vw,1.4rem)] leading-relaxed text-ink"
                  >
                    {card.meaning}
                  </span>
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
