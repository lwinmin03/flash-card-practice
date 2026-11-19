# Kanji Cards

A mobile-first JLPT kanji flashcard app. Study one card at a time, reveal the
reading and meaning, then grade yourself. Progress is saved locally in the
browser.

Currently ships with **JLPT N3** (127 cards). The deck registry is set up so
more levels can be added without touching the UI.

## Features

- Flip cards with a tap, and grade each card as **Again** or **Got it**
- Review queue for cards you want to see again
- Progress ring, per-deck stats, and resume from where you left off
- Shuffle/restart, previous/skip navigation, and keyboard shortcuts
- Mobile-first layout with safe-area support and dark mode
- Dedicated desktop layout for the deck list and study screen
- Data-driven decks loaded from JSON

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production build:

```bash
npm run build
npm start
```

## Data format

Cards live in `data/kanji.json`:

```json
[
  {
    "kanji": "空席",
    "hiragana": "くうせき",
    "meaning": "ထိုင်ခုံအလွတ်"
  }
]
```

Every entry needs all three string fields. Entries with a missing field are
skipped. The `meaning` field can contain any language.

## Adding another level

1. Add a JSON file to `data/` using the same shape (for example
   `data/n4.json`).
2. Import it in `lib/decks.ts`.
3. Add an entry to `DEFINITIONS`:

```ts
import kanjiN3 from "@/data/kanji.json";
import kanjiN4 from "@/data/n4.json";

const DEFINITIONS = [
  // existing N3 entry...
  {
    id: "n4",
    level: "N4",
    title: "JLPT N4",
    description: "Kanji & vocabulary",
    raw: kanjiN4,
  },
];
```

The home screen, review links, and `/study/n4` route are generated from this
registry. Card progress is keyed by deck id, so levels stay independent.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Space` | Flip the card |
| `←` / `→` | Previous / skip |
| `A` or `1` | Again (after revealing) |
| `G` or `2` | Got it (after revealing) |

## Notes

- Progress is stored in `localStorage` under `kanji-cards.progress.v1`.
- No accounts, server, or database are required.
- Built with Next.js App Router, React, Tailwind CSS, and TypeScript.
