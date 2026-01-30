# Frontend – CSV Import UI

This frontend application provides a real-time UI for importing a very large CSV file and managing customers. It is designed to stay responsive, show smooth progress updates, and restore state after page refresh.

---

## Tech Stack

- React 19
- TypeScript
- Fetch API
- Polling for realtime updates
- requestAnimationFrame for smooth progress animation

---

## Key Features

### CSV Import Progress

- Shows processed rows, skipped rows, percent, rate, elapsed time, and ETA
- Progress is restored after page refresh
- Displays recently imported customers (last N)

### Smooth Progress Bar

- Progress bar animates smoothly (no sudden jumps)
- Backend updates can be chunked, UI interpolation keeps it fluid

### Customers List

- Infinite scrolling list
- Already fetched pages are cached in memory
- Scrolling back does not trigger extra API calls

---

## Architecture Overview

- Backend persists import state in DB
- Frontend polls `/import/progress`
- Metrics (percent, ETA, rate) are calculated on the frontend
- UI never relies on guessed values

---

## Important Hooks

- `useImportProgress` – handles polling and progress fetch
- `useImportMetrics` – derives percent, ETA, elapsed safely
- `useSmoothProgress` – animates progress bar smoothly

---

## Safety & UX Decisions

- All values are clamped (no negative ETA, no >100% progress)
- Local ticking clock keeps ETA/elapsed live
- Polling starts only when import is running

---

## Running the Frontend

```bash
cd apps/frontend
pnpm install
pnpm dev
```

---

## Scope Notes

- No authentication (not required)
- Polling used instead of SSE for simplicity and reliability
- UI polish kept minimal; focus is correctness and performance

---

This frontend is built to be resilient, performant, and easy to reason about while handling very large imports.
