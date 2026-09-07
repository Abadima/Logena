# Logena Development Guidelines

## Philosophy & Core Pillars

Prioritize a **triple focus** when resolving conflicts:

1. **Insane Reliability** — Never crash; graceful fallbacks for all edge cases.
2. **Insane Performance** — Maintain sub-millisecond log latency.
3. **Insanely Low Overhead** — Minimal memory use, zero unnecessary dependencies, single-file centric (`logger.ts`).

---

## Engineering Rules

### Test-Driven Development (TDD)

- **Tests First:** Write unit or integration tests _before_ writing the implementation code so specifications remain flexible and robust.
- **Unstoppable Execution:** Once implementation starts, **do not stop coding** until all test suites successfully pass (`npm test`).

### Error Handling & Fallbacks

- Never throw from public logging methods.
- Always provide safe fallbacks for color lookups, missing level keys, and non-serializable or circular objects (e.g., fallback `JSON.stringify` to `String(message)`).
- Never use direct `console.log` in source code; use `Logena` methods.

### Import Ordering

Imports follow a **visual descending-length staircase** (longest lines first):

```typescript
import { type LogLevel, type ColorMap, Logena } from "../logger.js";
import type { TerminalColors } from "./types.js";
import { ms } from "../utilities/ms.js";
```

## Comprehensive PR & Publishing Checklist

### 1. Test-Driven Development & Quality

- [ ] **Tests Written First:** Test files in `tests/` were authored _before_ the implementation code.
- [ ] **All Tests Pass:** Run `npm test` and verify 100% success across all unit and integration suites.
- [ ] **Unstoppable Loop Complete:** Code execution and debugging continued until every test suite passed cleanly.

### 2. Architecture & Performance

- [ ] **Single-File Discipline:** Core logic remains centered in `logger.ts` to keep overhead minimal.
- [ ] **Hot-Path Validation:** The `formatMessage()` method remains allocation-free, lean, and within sub-millisecond latency bounds.
- [ ] **Zero Unnecessary Dependencies:** No external packages added without explicit justification.

### 3. Reliability & Fallbacks

- [ ] **Safe Error Boundaries:** Public logging methods never throw; all error paths (such as circular JSON objects or invalid colors) include graceful fallbacks.
- [ ] **No Direct Console Use:** Source code strictly avoids `console.log` in favor of `Logena`.

### 4. Code Hygiene & Standards

- [ ] **TypeScript Rigor:** Strict typing enforced with proper type-only imports and zero unauthorized `any` types.
- [ ] **Import Ordering:** Imports follow the visual descending-length staircase (longest lines first).
- [ ] **Linting & Formatting:** Codebase is fully clean under `oxlint` and `oxfmt`.

### 5. Version Control & Publishing

- [ ] **Semantic Commit Messages:** Commits follow clear conventions (`feat:`, `fix:`, `docs:`, `refactor:`).
- [ ] **Version Bump:** Package version updated appropriately in `package.json` following semantic versioning.
- [ ] **Clean Build & Types:** TypeScript compilation and declaration generation (`logger.d.ts`) succeed without warnings or errors.
