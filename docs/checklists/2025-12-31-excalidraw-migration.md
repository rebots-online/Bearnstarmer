# Checklist — Excalidraw-First Canvas Migration (2025-12-31T00:24Z)

## Preparation & Knowledge Graph
- [x] Record architecture/AST plan in `docs/architecture/2025-12-31-excalidraw-migration.md` (hKG sync pending until connectivity available).
- [ ] Sync updated architecture to hybrid knowledge graph node `urn:uuid:7f4c7a4c-9f51-4a78-958b-8d20ad1bd8a1` (blocked in current environment; document outcome).

## Dependency & Build Surface
- [x] Remove `@tldraw/tldraw` dependency from `apps/web/package.json` and add `@excalidraw/excalidraw`.
- [ ] Run `pnpm install` to refresh `pnpm-lock.yaml` for the dependency swap (blocked by 403 from npm registry).

## Canvas Refactor
- [x] Update `apps/web/src/components/canvas/CanvasShell.tsx` to render `<Excalidraw>` with dark theme and logger mount hook.
- [x] Adjust `apps/web/src/app.css` to style Excalidraw container; drop tldraw-specific selectors.

## Documentation Alignment
- [x] Refresh canvas provider wording in `README.md`, `PROMPT.md`, and `PRD_Barnstormer.md` to reflect Excalidraw-only posture.
- [x] Add migration note to prior architecture doc(s) as needed to prevent drift.

## Testing
- [ ] Run `pnpm --filter @tljustdraw/web build` to ensure TypeScript/Vite build passes without tldraw (blocked currently: missing `@excalidraw/excalidraw` due to registry 403).

## Wrap-Up
- [ ] Summarize progress in final PR message and note pending hKG sync tasks.
