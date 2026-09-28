# Kanban

A drag-and-drop Kanban board with card editing, labels, and due dates. Boards save in your browser, so there's nothing to sign up for.

**Live demo:** [kanban-bkness.vercel.app](https://kanban-bkness.vercel.app) — it opens with a starter board. Drag cards between columns, click one to edit it, and use **Reset board** to start over.

---

## Features

- **Drag and drop** cards between columns and reorder columns (dnd-kit, with keyboard support)
- **Card editor** — title, description, labels, and due date; changes save as you type
- **Due dates** turn amber when due soon, red when overdue, and get a check once the card reaches the last column
- **Columns** — click a title to rename it; the ··· menu renames or deletes (with a card count in the confirmation)
- **Board stats** — cards, overdue, and done at a glance
- **Saved in your browser** (localStorage), with a starter board for first-time visitors — no account needed
- **Optional account + cloud sync** — sign up and your board follows you across devices; the browser board is kept separately for when you sign out
- **Search and label filter** across all columns, with per-column match counts
- **Keyboard shortcuts** — `/` search, `N` new card, `?` for the full list (including moving cards with Space + arrows)

## Tech stack

| Layer | Technology |
|---|---|
| UI | React 19, TypeScript, Vite |
| State | Zustand with `persist` middleware |
| Drag and drop | dnd-kit (core + sortable) |
| API | Vercel Functions (`api/`), Web `Request`/`Response` handlers |
| Database | Neon Postgres via `@neondatabase/serverless` (HTTP driver) |
| Auth | Email + password (bcrypt), httpOnly session cookie |
| Tests | Playwright end-to-end, run in GitHub Actions |
| Hosting | Vercel |

## Architecture notes

- **Normalized state.** Cards and columns are stored by id (`Record<string, Card>`), with order kept separately in `columnOrder` and `cardOrder`. Moving a card changes two id arrays instead of copying nested objects.
- **Clicks vs. drags.** dnd-kit's pointer sensor only starts a drag after 5px of movement, so a plain click opens the card editor.
- **Native `<dialog>`** for the editor gives Esc-to-close, focus containment, and modal semantics without a library.
- **Sync = one JSON document + a version number.** Each account has one board row (`jsonb`). A save sends the version it was based on; if another tab or device saved in between, the server rejects it with `409` and the newer board, which the client loads and says so. Saves are debounced (800 ms) and flushed with `keepalive` when the tab hides.
- **Guest and account boards never mix.** The store persists to `kanban-storage` for guests and `kanban-storage:<userId>` when signed in, so signing in can't overwrite the browser board, and signing out restores it.
- **Sessions** are 32 random bytes in an `HttpOnly; Secure; SameSite=Lax` cookie; the database stores only a SHA-256 of each token. Mutating requests must be JSON (a cross-site form can't send that without a CORS preflight). Failed sign-ins are rate-limited in Postgres, so the limit holds across function instances.
- **A bug worth remembering:** the app once rendered `<body>` inside `#root`. React 19 treats `<body>` as a singleton it takes over, and the first text input's `selectionchange` event sent React's event lookup into an infinite loop that froze the tab. An end-to-end test now guards against it.

## Getting started

```sh
git clone https://github.com/bkness/kanban.git
cd kanban
npm install
npm run dev
```

`npm run dev` runs the board in guest mode. For accounts, create a Postgres database (e.g. Neon), apply `db/schema.sql`, put its URL in `.env` as `DATABASE_URL` (see `.env.example`), and run `vercel dev` so the `api/` functions run too.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run test:e2e` | Run the Playwright tests (builds and serves the app itself) |

## License

MIT © [Brandon Kelly](https://github.com/bkness)
