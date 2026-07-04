# Standards Review: b4cba70 → HEAD

`vp check` passes clean (format, lint, types). Report excludes what tooling already enforces.

---

## Hard Violations — CONTEXT.md Domain Glossary

### `src/mock-feed.ts` L6-10 — **Mysterious Name** (CONTEXT.md "Sender")

`MockUser` interface uses "User" where the domain glossary prescribes **Sender**: _"The viewer who authored a message."_ The glossary explicitly marks `user, from, chatter, username` as terms to avoid. The interface and the `USERS` constant should be `MockSender` / `SENDERS`.

---

## Baseline Smells (judgement calls)

### `src/main.ts` L8, L16-17, L20-24 — **Primitive Obsession** + type-unsafe casts

`renderMessage(detail: Record<string, unknown>)` eschews the domain model entirely. CONTEXT.md defines Message, Sender, Badge, and Event as first-class concepts, but the code casts `detail.tags as Record<string, string>`, `detail.from as string`, `detail.body as string` — six `as` casts in one 20-line function. A typed event detail interface would eliminate all of them.

### `src/main.ts` L20-24 + `src/__tests__/build-output.test.ts` L25-28 + `index.html` L11-16 — **Shotgun Surgery**

Template token strings (`{from}`, `{color}`, `{message}`, `{messageId}`, `{badges}`) are duplicated across three files. Adding or renaming a token requires editing `index.html`, `main.ts`, and `build-output.test.ts` in lockstep. These should be a shared constant/map or generated from a single source of truth.

### `src/streamlabs-tokens.ts` L38-41 + `vite.config.ts` L27-28 — **Duplicated Code**

Two separate Vite plugins (`streamlabsTokens` dev transform, `buildWidgetPlugin` build transform) both implement field-token placeholder replacement. The dev plugin replaces with config values; the build plugin escapes them for PostCSS and restores them post-bundle. The concern — "handle field tokens in CSS" — is split across two plugins in two files.

### `src/streamlabs-tokens.ts` L38-41 — **Repeated Switches**

Four sequential `.replace()` calls, one per field. Adding a field setting to `widget.config.json` requires touching: `WidgetConfig` interface, the `transform` replaces, `style.css` usage, and `build-output.test.ts` expectations. A loop over `Object.entries(config)` would grow automatically.

### `src/mock-feed.ts` L6-11 + `src/main.ts` L8 + tests — **Data Clumps**

The event detail shape `{type, command, from, body, tags: {display-name, color, mod}, messageId}` is constructed in `mock-feed.ts`, destructured in `main.ts`, and reconstructed in three test files — all without a shared type. This is the domain Event concept from CONTEXT.md, deserving its own interface.

### `vite.config.ts` L66 — type mismatch papered over

`streamlabsTokens() as Plugin` casts between Vite's `Plugin` (what `streamlabsTokens` returns) and Vite+'s `Plugin` (what `defineConfig` expects). The cast masks the underlying mismatch.

### `src/__tests__/mock-feed.test.ts` L32-33, L62-63 — **test pollution risk**

Tests 2 and 3 install `vi.spyOn(window, "dispatchEvent")` but never call `mockRestore()`. If tests run in non-isolated order, the spy leaks into subsequent tests.
