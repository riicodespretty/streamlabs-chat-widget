# Standards Review: a81408b...HEAD

**Scope**: 17 commits, 25 files. Standards: AGENTS.md + CONTEXT.md.

## Hard Findings

### 1. Stale domain glossary — CONTEXT.md:16

CONTEXT.md Profile entry says "built by `build-all.ts`", but `build-all.ts` was removed (commit `7cc8f63`). The multi-profile build now lives in `vite.config.ts` via `multiProfileBuildPlugin`.

### 2. Dead code (Speculative Generality) — profiles.ts:36-45

`setProfileOverride`, `getProfileOverride`, and `_profileOverride` are defined but **never called** anywhere. The comment says "used by build-all.ts for per-profile builds" — that file is gone. The multi-profile build uses `process.env.PROFILE` (vite.config.ts:28) instead. Dead code + stale comment.

### 3. Duplicated CSS resolver — vitest.config.ts:15-21 ≈ profile-css.ts:6-16

`vitest.config.ts` inlines a `resolveId` plugin that duplicates the exact logic of `profileCssResolver()` from `src/plugins/profile-css.ts`. Two sources of truth for CSS resolution; a change to one must be mirrored in the other.

## Judgment Findings

### 4. Duplicated project-root pattern — profile-api.ts:6, profile-html.ts:5

`(import.meta as unknown as { dirname: string }).dirname` repeated verbatim in two plugins. Minor duplication, but `setProjectRoot` already exists in `shared/profiles.ts` — these could use `getProjectRoot()`.

### 5. innerHTML with unescaped profile names — profile-switcher.ts:8,25

`buttonHTML()` interpolates `p.name` (from directory listing) directly into HTML via `innerHTML`. Profile directory names are not user-controlled at runtime, but a crafted directory name could inject HTML. Low risk for a dev-tool UI but a smell.

### 6. Profile resolve path not checked against path traversal — profiles.ts:20

`getProfileName()` reads `.active` and uses it directly in `resolve()` without validating for `..` or path separators. The test suite (`profile.test.ts:29-31`) verifies the `.active` file contents are safe, but the runtime code itself does not guard.

## Non-Findings (reviewed, no issue)

- AGENTS.md toolchain rules (`vp install`, `vp check`, `vp test`): all pass per context (35/35 tests, vp check clean).
- No `test.only`/`test.skip` in test files.
- Import hygiene: `vite-plus/test` imports used consistently per AGENTS.md.
- `import type` used for type-only imports.
- Plugin names are unique and descriptive.
- `vitest.config.ts` correctly uses `import.meta.dirname!` with non-null assertion (vite-plus convention).
- `vp test` smoke: `build-output.test.ts` now tests per-profile output dirs — good coverage expansion.
