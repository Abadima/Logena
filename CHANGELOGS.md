# Notable Changes & Versioning

All notable changes to this project will be documented in this file :3

This project adheres to [Semantic Versioning](https://semver.org/) starting `v1.0.2`.

## 1.1.0 [2026-APR-01]

### Added

- All log levels now accept an optional `appName` parameter to override the preset application name for that specific log level call.
- **Color palette expansion**: Added 32 new extended ANSI 256-color variants (light/dark shades, semantic colors like `success`, `failure`, `warning`, `info`, `debug`, `accent`).
- **Package exports map**: Explicit `exports` field in `package.json` for clearer ESM/CommonJS resolution.
- **Automated regression test suite**: New `tests/` directory with comprehensive edge-case coverage for robustness validation.
- **Optional ASCII kitty meow on errors**: Added `meowOnError` config and optional `errorCatAscii` override.
- **Variadic log arguments**: `Logena.info/warn/error/debug` now support multiple values in one call (e.g., `Logena.info("x", { a: 1 }, 123, true)`).
- **Broader object/value support**: Logging methods now accept object-first and mixed-type payloads directly.
- **`minLevel?: LevelName`** added to `set()` config. Accepted values: `"debug"` (default, logs everything), `"info"`, `"warn"`, `"error"`. Levels below the threshold are suppressed before any argument parsing or formatting.
- **`noColor?: boolean`** added to `set()` config. When `true`, all ANSI escape codes are stripped from every output field (timestamp, appName bracket, level label, message). Ideal for CI pipelines, file sinks, or any consumer that interprets raw bytes.
- **`serializeObjects?: boolean`** added to `set()` config. When `false`, non-string non-Error values emit type shorthands: `[Object]`, `[Array]`, `"null"`, or `String(value)`. Zero JSON parse cost — safe for high-throughput paths where object shape is irrelevant.
- **`LevelName` type exported**: Consumers can import `import type { LevelName } from "logena"` for typed `minLevel` arguments.

### Fixed

- **Partial colors config crash**: Guard undefined spread in `set()` method when `colors.levels` is not provided; now safely merges partial color configurations.
- **Unsafe color key fallback**: All color lookups (timestamp, appName, message, levels) now safely fallback to valid defaults when keys are missing or invalid.
- **JSON stringify circular reference crash**: Wrap object serialization in try/catch; gracefully fallback to `String(message)` for circular or non-serializable payloads.
- **Build dependency mismatch**: Added missing ESLint TypeScript parser/plugin dev dependencies used by `eslint.config.mjs`.
- **Test script reliability**: `npm test` now runs JS regression tests directly from `tests/edge-cases.js`.
- **Error-aware `stringifyPart()`**: `instanceof Error` is checked before `serializeObjects` and before `JSON.stringify`. The full stack trace (which already contains the message) is emitted directly — `JSON.stringify` on an Error produces `{}`, which was silently wrong.

### Performance

- **Prefix cache**: `rebuildCache()` precomputes the full ANSI-colored `[ AppName ] LEVEL: ` prefix for all four levels on `set()` and class initialisation. `formatMessage` now performs zero color lookups per call — average latency dropped ~43% (561 ns → 319 ns across benchmark rounds).
- **Timestamp formatting**: Replaced two regex operations (`replace("T", " ")` + `/\..+/`) with a fixed-length `iso.slice()` — zero allocations, O(1).
- **Early debug guard**: `debug()` bails out before any argument parsing when `debugMode` is false, producing zero allocations for disabled debug logs.
- **Compact JSON serialisation**: `JSON.stringify(part)` replaces `JSON.stringify(part, null, 2)` in `stringifyPart` — faster serialisation and less memory.
- **In-place color mutation in `set()`**: Replaced a 3-object spread (colors + levels + intermediate) with targeted property assignments; `rebuildCache()` is called once afterward.
- **Per-second timestamp cache**: `_formatTimestamp()` now stores the formatted string and an integer second counter. `Math.floor(Date.now() / 1000)` (~50 ns) gates a ~1 500 ns `new Date().toISOString()` call, yielding a large net saving during same-second log bursts. The cache is invalidated exactly once per wall-clock second.
- **Eliminated `.toLowerCase()` in hot path**: `formatMessage` parameter is now typed `"info" | "warn" | "error" | "debug"` and each log method passes the lowercase literal directly. Removes one string allocation per log call.
- **Cached ANSI reset code (`_reset`)**: `rebuildCache()` stores `terminalColors.reset` (or `""` in noColor mode) into `_reset`. `formatMessage` and `_formatTimestamp` read this field instead of the module-level constant, making the noColor branch branch-free at log time.
- **Numeric `minLevel` filtering**: Integer comparison (`LEVEL_MAP[level] < this.minLevel`) added before `parseLogArguments`. Zero cost when default (`minLevel = 0`); silences entire level bands with a single branch that V8 can predict perfectly.

### Changed

- **README examples**: Updated documentation to clearly show TypeScript default import, named import, and CommonJS require patterns all working correctly.
- **Logger resilience**: Lenient fallback behavior for invalid color values — logging continues gracefully instead of breaking on misconfiguration.
- **README features and set() docs**: Documented optional kitty meow behavior and config options.
- **Internal cleanup**: Removed temporary `// LOGENA-FIX:` inline comments after stabilizing fixes.

### Internals

- **`noColor` in `rebuildCache()`**: When `noColor` is true, `rebuildCache` takes an early-exit path that writes plain-text prefix strings and sets `_reset = ""`. This ensures `formatMessage` never branches on noColor at runtime.
- **New static fields**: `_reset`, `_cachedTimestamp`, `_cachedTimestampSec`, `minLevel`, `noColor`, `serializeObjects`. All initialized at class declaration with safe defaults.

### Testing

- **`tests/logger.test.js`** added: uses Node's built-in `node:test` runner (zero external dependencies). Covers all log levels, appName override, minLevel filtering, noColor output, `serializeObjects` shorthands, Error stack serialization, circular-reference safety, timestamp cache correctness, meowOnError, and config merge semantics.
- **Benchmark suite**: 100 000-iteration median-latency tests for `info`, `warn`, `error`, `debug`. Ceiling set at 5 µs/call (generous for CI). Results printed to stdout for visibility.

## 1.0.2 [2024-OCT-15]

### Changed

- Class name from `Logger` to `Logena`.

### Fixed

- Class methods, now they're actually accessible from the class instance.

## 1.0.1 [2024-OCT-15]

### Changed

- `logger.js` from `/dist` to project root.
- `package.json` to reflect changes.
- Minimum NodeJS version to `14.0.0`, let's be fr, we don't need to be that strict.

### Removed

- `/dist` directory.
- `/Tests` directory.
- `clean.mjs` (Now runs via npm script `uglifyjs ...`)

## 1.0.0 [2024-OCT-15]

### Added

- Initial release of the `Logger` class.
- Added `terminalColors` object for terminal text styling.
- Implemented `Logger` class with the following methods:
  - `set(config: { debug?: boolean, appName?: string, useTimestamps?: boolean, colors?: { timestamp?: keyof typeof terminalColors.textColors, appName?: keyof typeof terminalColors.textColors, message?: keyof typeof terminalColors.textColors, levels?: { info?: keyof typeof terminalColors.textColors, warn?: keyof typeof terminalColors.textColors, error?: keyof typeof terminalColors.textColors, debug?: keyof typeof terminalColors.textColors } } }): void` - Configure the logger settings.
  - `info(message: string | object): void` - Log an info message to the console.
  - `warn(message: string | object): void` - Log a warning to the console.
  - `error(message: string | object): void` - Log an error to the console.
  - `debug(message: string | object): void` - Log a debug message to the console (only if `debugMode` is enabled).
