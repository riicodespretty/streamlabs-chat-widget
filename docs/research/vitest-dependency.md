# Vitest Dependency in Vite+ Projects

## Finding: `vitest` is bundled; `@vitest/coverage-v8` is not.

**Vite+ bundles vitest internally.** `vite-plus` lists `vitest` 4.1.9 as a direct `dependency` (not dev/peer) in its `package.json` (line 369). It also bundles all vitest sub-packages: `@vitest/runner`, `@vitest/expect`, `@vitest/snapshot`, `@vitest/spy`, `@vitest/utils`, `@vitest/mocker`, `@vitest/browser`, `@vitest/browser-preview`, `@vitest/pretty-format`.

**`vp test` delegates directly to the bundled vitest.** Running `vp test run --help` shows vitest's own CLI flags, confirming no local vitest install is needed.

**`vitest` in `devDependencies` is redundant.** The bundled copy satisfies all test-running needs. Including it adds unnecessary install weight and version drift risk.

**`@vitest/coverage-v8` is NOT bundled** (absent from Vite+'s dependencies). It must remain as an explicit `devDependencies` for `--coverage`.

### Recommendation

Remove `vitest` from `devDependencies`. Keep `@vitest/coverage-v8`.

### Sources

- `vite-plus/package.json` lines 354–371 (dependencies list)
- `vite-plus/docs/guide/test.md` ("`vp test` runs tests with Vitest")
- Verified: `vp test run --help` outputs vitest CLI flags using bundled vitest 4.1.9
