# Kanji Cards

A mobile-first JLPT kanji flashcard app. Study one card at a time, reveal the
reading and meaning, then grade yourself. Progress is saved locally in the
browser.

Currently ships with **JLPT N3** decks, a **katakana-only** deck (85 cards), and
a **same-meaning pairs** deck (77 comparisons). The deck registry is set up so
more levels can be added without touching the UI.

## Features

- Flip cards with a tap, and grade each card as **Again** or **Got it**
- Katakana-only practice with English and Myanmar meanings
- Same-meaning pair cards for comparing near-synonyms
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

Every entry needs `kanji` (or `word`) and `meaning`. `hiragana` is optional:
a word written only in kana uses itself as its reading. Entries with a missing
required field are skipped. The `meaning` field can contain any language.

### Same-meaning pairs

Comparison pairs use a `left`/`right` shape. Each side needs a `word` and a
`meaning_mm` (or `meaning`):

```json
[
  {
    "left": { "word": "絶対に", "meaning_mm": "သေချာပေါက်" },
    "right": { "word": "必ず", "meaning_mm": "မဖြစ်မနေ" }
  }
]
```

Register the deck with `kind: "similar"`. If the pairs live inside a grouped
file (like `n3_goi_myanmar_batch1.json`), set `group` to the group name:

```ts
{
  id: "n3-similar",
  level: "N3",
  title: "JLPT N3 同じ意味",
  description: "Same-meaning word pairs · compare & contrast",
  kind: "similar",
  group: "similar_meanings",
  raw: n3Goi,
}
```

### Kana-only decks

Decks that have no kanji/reading pair (katakana, onomatopoeia) use
`word`/`reading` and can add an optional `meaning_en`:

```json
[
  {
    "word": "コーヒー",
    "meaning_en": "coffee",
    "meaning": "ကော်ဖီ"
  }
]
```

Set `kanaOnly: true` in the deck definition. The study screen then hides the
kanji ↔ reading switch and shows the English gloss and Myanmar meaning on the
back of each card.

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
