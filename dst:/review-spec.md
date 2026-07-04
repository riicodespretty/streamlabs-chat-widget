# Spec Review — b4cba70…HEAD

## (a) Missing or Partial Requirements

1. **No hardcoded mock event on page load** — Issue #8 requires "One hardcoded mock event on page load." The implementation only has the timer-based feed from issue #9; the page loads empty and waits 200–800ms for the first message. There is no immediate render.

2. **Badges never rendered** — PRD user story 3: "badges next to names." In `main.ts:20`, `{badges}` is always replaced with `""`. The mock feed sends badge data (`mod: "1"`, etc.) for 5 of 7 users, but `renderMessage()` discards it rather than generating `<img>` elements. CSS rules for `.sl__chat__badges img` exist but are never exercised in dev.

3. **`{badges}` token not verified in build output test** — `build-output.test.ts` checks for `{from}`, `{color}`, `{message}`, `{messageId}` in `widget.html` but omits `{badges}`, despite it being a message token in the `#chatlist_item` template.

4. **No message cleanup in dev** — The CONTEXT.md definition of Chat Box says Streamlabs "handles the message lifecycle (animation, cleanup)." The CSS defines `fadeOut` but the JS never removes DOM elements after `message_hide_delay`. In production Streamlabs cleans up; in local dev messages accumulate forever.

## (b) Scope Creep

1. **Vite-plus tooling config** — `vite.config.ts:79-89` adds `staged`, `fmt`, and `lint` configuration blocks with Vite-plus-specific rules (`vite-plus/oxlint-plugin`, `vite-plus/prefer-vite-plus-imports`). No issue or PRD mentions linting, formatting, or staged checks.

2. **`docs/agents/` documentation** — Three new files (`domain.md`, `issue-tracker.md`, `triage-labels.md`) are process artifacts not requested by any issue acceptance criteria.

3. **Vite-plus type imports** — `import type { Plugin } from "vite-plus"` in `vite.config.ts:1` and `streamlabsTokens() as Plugin` cast on line 66. The type is imported from `vite-plus` while `streamlabs-tokens.ts` imports from `"vite"`, forcing a cast. Standard Vite types would avoid this.

## (c) Implemented but Questionable

1. **Badge data discarded in `renderMessage()`** — Line 20: `html = html.replace(/\{badges\}/g, "");`. The mock feed provides badge flags in `tags` (5 users carry `mod`, `vip`, or `sub` badges). Nothing in `renderMessage()` maps these to `<img>` tags. The `{badges}` token is only meaningful when Streamlabs' production engine replaces it, making local badge rendering untestable. Either badge rendering should be implemented in dev, or `{badges}` should be acknowledged as production-only in a comment.
