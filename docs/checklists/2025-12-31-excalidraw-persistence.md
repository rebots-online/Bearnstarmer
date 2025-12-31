# Checklist — Excalidraw Canvas Persistence (2025-12-31T01:15Z)

## Knowledge Graph & Planning
- [x] Document architecture in `docs/architecture/2025-12-31-excalidraw-persistence.md` (hKG sync pending; record outcome later).
- [ ] Sync architecture/checklist to hKG (Neo4j/Qdrant/Postgres) under project `urn:uuid:7f4c7a4c-9f51-4a78-958b-8d20ad1bd8a1` once connectivity is available.

## Implementation — Canvas Persistence
- [x] Update `apps/web/src/components/canvas/CanvasShell.tsx`:
  - [x] Define `PERSISTENCE_KEY = 'tljustdraw-excalidraw-local'`.
  - [x] Add helper `loadInitialData()` (guards for `window`, parses JSON, logs warnings on failure) returning `ExcalidrawInitialDataState | undefined`.
  - [x] Add helper `persistSnapshot(elements, appState, files)` (try/catch `localStorage.setItem`, log errors).
  - [x] Provide `initialData={loadInitialData()}` to `<Excalidraw>`.
  - [x] Provide `onChange={handleChange}` that calls `persistSnapshot` and logs once on mount.
  - [x] Keep `aria-label` and theme props intact.
- [x] Ensure styling in `apps/web/src/app.css` remains compatible (no tldraw-specific selectors; Excalidraw fills container).

## Verification
- [x] Run `pnpm install` (blocked: npm registry 403 for `@excalidraw/excalidraw`).
- [x] Run `pnpm --filter @tljustdraw/web build` (blocked: unresolved `@excalidraw/excalidraw` due to registry 403).

## Documentation & Wrap-Up
- [x] Update this checklist with statuses in real time.
- [x] Summarize changes in PR body, noting persistence fix and any blocked tests (npm registry 403).
