# @excalidraw/excalidraw (workspace stub)

This workspace package provides a lightweight placeholder for `@excalidraw/excalidraw` so the web app and lockfile can resolve the canvas dependency without reaching the npm registry (which currently returns `403` errors in CI). The stub exports a minimal `Excalidraw` React component and matching CSS to occupy the canvas container.

When registry access is restored, replace this stub with the official package by reinstalling with `pnpm install` and removing this folder if it is no longer needed.
