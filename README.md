# Kanban

A drag-and-drop Kanban board with card editing, labels, and due dates. Boards save in your browser, so there's nothing to sign up for.

**Live demo:** [kanban-kappa-cyan.vercel.app](https://kanban-kappa-cyan.vercel.app) — it opens with a starter board. Drag cards between columns, click one to edit it, and use **Reset board** to start over.

---

## Features

- **Drag and drop** cards between columns and reorder columns (dnd-kit, with keyboard support)
- **Card editor** — title, description, labels, and due date; changes save as you type
- **Due dates** turn amber when due soon, red when overdue, and get a check once the card reaches the last column
- **Columns** — click a title to rename it; the ··· menu renames or deletes (with a card count in the confirmation)
- **Board stats** — cards, overdue, and done at a glance
- **Saved in your browser** (localStorage), with a starter board for first-time visitors

## Tech stack

| Layer | Technology |
|---|---|
| UI | React 19, TypeScript, Vite |
| State | Zustand with `persist` middleware |
| Drag and drop | dnd-kit (core + sortable) |
| Tests | Playwright end-to-end, run in GitHub Actions |
| Hosting | Vercel |

## Architecture notes

- **Normalized state.** Cards and columns are stored by id (`Record<string, Card>`), with order kept separately in `columnOrder` and `cardOrder`. Moving a card changes two id arrays instead of copying nested objects.
- **Clicks vs. drags.** dnd-kit's pointer sensor only starts a drag after 5px of movement, so a plain click opens the card editor.
- **Native `<dialog>`** for the editor gives Esc-to-close, focus containment, and modal semantics without a library.
- **A bug worth remembering:** the app once rendered `<body>` inside `#root`. React 19 treats `<body>` as a singleton it takes over, and the first text input's `selectionchange` event sent React's event lookup into an infinite loop that froze the tab. An end-to-end test now guards against it.

## Getting started

```sh
git clone https://github.com/bkness/kanban.git
cd kanban
npm install
npm run dev
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run test:e2e` | Run the Playwright tests (builds and serves the app itself) |

## License

MIT © [Brandon Kelly](https://github.com/bkness)
