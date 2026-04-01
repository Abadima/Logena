# Logena Code Standards & Development Guidelines

## Philosophy

Logena prioritizes a **triple focus**:

- **Insane Reliability** — Safe, correct behavior; catch edge cases before shipping; graceful fallbacks, never crash.
- **Insane Performance** — Fast formatting, optimal hot-path allocation; preserve sub-millisecond log latency.
- **Insanely Low Overhead** — Minimal memory use, compact code size, zero unnecessary dependencies.

All code changes must balance these pillars. When they conflict, prioritize reliability first, then performance, then overhead.

---

## TypeScript Code Standards

### Typing Rules

- Prefer `satisfies` over `as` for type assertions — `export const Logena = { ... } satisfies Logger;` where appropriate.
- Use `import type` for type-only imports: `import type { LogLevel, ColorMap } from "./types.js";`
- Avoid `any` unless absolutely unavoidable — explicit types protect both the logger and consumers.
- Prefer explicit return types on exported functions: `export function set(config: Config): void { ... }`
- Destructure patterns with explicit types: `const { colors, debug } = config satisfies Config;`

### Export & Function Style

- Prefer **function declarations** for exported utility functions: `export function formatTimestamp(date: Date): string { ... }`
- Use static class methods for grouped, stateful operations: `class Logena { static set() { ... } static info() { ... } }`
- Avoid instance-based designs unless meaningful encapsulation is needed — module-level singletons are acceptable for a logger.

### Constants & Naming

- `camelCase` for normal constants: `const maxMessageLength = 4096;`
- `UPPER_SNAKE_CASE` for magic numbers or configuration limits: `const MAX_LEVEL_NAME_LENGTH = 8;`
- Extract magic numbers into named constants — never inline magic values.
- Use intention-revealing names: `formatTimestamp`, `isValidColor`, `applyColorFallback` — not `fmt`, `check`, `fix`.
- Avoid single-letter or abbreviated variable names: `level` not `l`, `color` not `c`, `config` not `cfg`.
- Use `Set` for membership checks on static lists: `const VALID_COLORS = new Set(["red", "blue", "green", ...]);`

### Async & Error Handling

- Prefer `Promise.catch()` over try/catch for simple error suppression in non-critical paths.
- Use try/catch for operations with legitimate failure modes (e.g., `JSON.stringify()` with circular references).
- Always provide a fallback: catch errors and log the fallback behavior, never silently suppress.
- Example: `const msg = typeof message === "string" ? message : JSON.stringify(message, null, 2).catch(() => String(message));`
- Do not throw from public logging methods — always find a way to log or fallback gracefully.

### Logging

- All logging via `Logena` — never use `console.log` directly in source code.
- Debug statements in source: `Logena.debug("SET_CONFIG", config);` with context objects.
- Use concise, uppercase status for quick visual scanning: `Logena.debug("FALLBACK_COLOR", { requested: "invalid", used: "white" });`

### Import Ordering

Imports follow a **visual descending-length staircase** — longest lines first:

```typescript
import { type LogLevel, type ColorMap, Logena } from "../logger.js";
import type { TerminalColors } from "./types.js";
import { ms } from "../utilities/ms.js";
```

If correctness requires a different order, correctness takes priority.

---

## Performance & Overhead Rules

### Hot-Path Optimization

- The `formatMessage()` method runs on every log call — keep it **lean and allocation-free** where possible.
- Avoid regex compilation in loops; use string methods (`split`, `replace`, `slice`) for terminal formatting.
- Cache computed values (e.g., `terminalColors.textColors` lookups) if reused across calls.
- Benchmark any changes to `formatMessage()` to confirm sub-millisecond latency.

### Memory Efficiency

- Reuse the same `colors` object shape across all instances; avoid dynamic property creation.
- Merge partial configs using shallow spread only; deep clones are not necessary for logger state.
- Do not allocate large temporary objects in `formatMessage()` — inline ANSI code strings instead of building arrays.

### Code Size

- Prefer native `typeof`, string methods, and `Object` utilities over library helpers for simple cases.
- Minify inline helper functions; avoid exporting internal utilities unnecessarily.
- Comment only critical logic; omit obvious intent descriptions to keep gzip size down.

---

## Reliability & Correctness Rules

### Null Safety & Fallbacks

- **Every color lookup** must have a safe fallback: `terminalColors.textColors[colorKey] ?? terminalColors.textColors.white`
- **Every level reference** must handle missing keys: `this.colors.levels[level.toLowerCase() as keyof ...] ?? this.colors.levels.info`
- **Every config merge** must guard against partial objects: `...config.colors.levels || {}`

### Object Handling

- Messages may be circular, non-serializable, or gigantic — wrap `JSON.stringify()` in try/catch and provide a fallback.
- Fallback: `String(message)` or `"[Unserializable Object]"` with a length cap to prevent log spam.

### Type Safety

- Leverage TypeScript's `keyof` and `as const` to make invalid log levels and colors impossible to construct.
- Export type contracts for `Config`, `ColorMap`, and `LogLevel` to guard public API.
- Validate user input at the boundary (the `set()` method) — but fail gracefully with lenient fallback, not exceptions.

---

## Testing Strategy

### Unit Tests (in `tests/`)

- **Config merging**: partial colors, missing levels, invalid keys.
- **Message formatting**: strings, objects, circular references, large payloads.
- **Color fallback**: invalid colors, missing level colors, all valid colors explicitly.
- **Timestamp formatting**: timezone correctness, edge dates.

### Integration Tests (in `tests/`)

- **Import compatibility**: TS default import, TS named import, CJS require destructuring.
- **Runtime environments**: Node 14+, verify no syntax errors or missing globals.

### Performance Tests (optional, `tests/perf/`)

- Benchmark `formatMessage()` latency and memory allocation over 10k calls.
- Flag regressions > 5% deviation from baseline.

---

## File Organization

- **`logger.ts`** — Core Logena class with all public methods and formatting logic.
- **`logger.d.ts`** — Type declarations for public API and internal contracts.
- **`tests/`** — Dedicated test directory for edge-case regression suite.
- **`.github/copilot-instructions.md`** — This file; guidance for future contributors.

Keep the implementation **single-file centric** (logger.ts) to minimize overhead and simplify dependency resolution.

---

## Checklist for PRs

Before submitting a change:

- [ ] All tests pass (`npm test`).
- [ ] No `any` types introduced without justification.
- [ ] Fallback behavior is well-defined for error cases (no silent failures).
- [ ] Hot-path code (e.g., `formatMessage()`) has been profiled if modified.
- [ ] No external dependencies added without justification.
- [ ] Commit messages follow semantic clarity: `feat: ...`, `fix: ...`, `docs: ...`.
- [ ] Inline comments marked `LOGENA-FIX:` document the intent and link to issues/decisions.
