import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <span
        aria-hidden="true"
        className="grid h-16 w-16 place-items-center rounded-2xl bg-accent-soft font-kanji text-2xl text-accent"
      >
        無
      </span>
      <h1 className="mt-6 text-xl font-semibold">Deck not found</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        That level is not in the deck registry yet.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-accent px-6 text-sm font-semibold text-canvas transition hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        Back to decks
      </Link>
    </main>
  );
}
