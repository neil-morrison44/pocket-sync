# AGENTS.md

## Validation

- `npm test` — vitest, using the standalone `vitest.config.ts` (default `node` environment; the app's vite plugins are intentionally **not** applied to tests)
- `npx tsc` — typecheck; `tsconfig.json` includes `src`, so test files are typechecked too
- Do **not** use ESLint as a gate: the config is legacy-format (`eslintConfig` in `package.json`) under ESLint 9, so it fails out of the box (needs `ESLINT_USE_FLAT_CONFIG=false`), and the codebase has ~240 pre-existing problems. Don't try to fix linting as a side effect of other work.

## Testing pitfalls

- **Jotai vanilla stores cache atom reads** and only invalidate on atom dependencies — mutating a closure variable (e.g. `atom(() => current)` where `current` is reassigned) does *not* invalidate. Simulate refreshes with `store.set(sourceAtom, newValue)`.
- **Tauri plugin functions** (`@tauri-apps/plugin-*`) import fine in Node but fail at *call* time (no `window.__TAURI_INTERNALS__`). Mock IPC with `mockIPC` from `@tauri-apps/api/mocks` and mark the test file with `// @vitest-environment happy-dom`. Note the official `mockIPC` handler drops `invoke`'s third argument — `plugin:fs|write_text_file` passes its path/options there — so wrap `window.__TAURI_INTERNALS__.invoke` to capture it if you need to assert on it.
- Atoms with async reads (e.g. `atomWithAppLocalStorage`) make `store.get` return a promise — await it.

## Environment pitfalls

- If npm fails with `EPERM` on `~/.npm` (root-owned cache files): fix with `sudo chown -R <your-uid>:<your-gid> ~/.npm`, or run with `--cache <writable-dir>` (sandboxed agent terminals cannot write to `~/.npm` at all).
