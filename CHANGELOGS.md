# Notable Changes & Versioning

All notable changes to this project will be documented in this file :3

This project adheres to [Semantic Versioning](https://semver.org/) starting `v1.0.2`.

## 1.1.1 [DRAFT, NOT RELEASED]

### Fixed

- Timestamp cache could render a timestamp one second ahead when the cached second and the rendered text came from two separate clock reads that straddled a tick. Text is now derived from the cached second itself.

### Performance

- `formatMessage()` builds multi-argument messages with a loop instead of `.map().join(" ")`, skipping a closure and array allocation per call.
- Timestamp cache now stores the fully rendered segment instead of just the text, so a cache hit is a plain field read.
- `build` now runs `uglifyjs -c -m` instead of `--comments all`. `dist/logger.js` down from 9.2 KB to 5.5 KB.
- Removed `bright`, `dim`, `underscore`, `blink`, `reverse`, `hidden` from `terminalColors` — unused, and not part of the public color-key type.

### Changed

- Benchmark's memory column now reports heap retained after a forced GC instead of raw RSS growth, which was mostly measuring the benchmark harness itself. See `benchmarks/`.
- README performance table and output examples updated to match.

### Testing

- Added tests for multi-argument ordering and timestamp cache invalidation on color changes.

## 1.1.0 [2026-APR-01]

### Added

- `appName` parameter on every log level, to override the preset name for a single call.
- 32 new ANSI 256-color variants, including semantic names like `success`, `failure`, `warning`, `accent`.
- Explicit `exports` field in `package.json`.
- `tests/` directory with a `node:test` regression suite.
- `meowOnError` config, with an optional `errorCatAscii` override.
- Variadic log arguments — `Logena.info("x", { a: 1 }, 123, true)` and similar now work.
- `minLevel`, `noColor`, and `serializeObjects` options on `set()`.
- `LevelName` type export, for typed `minLevel` arguments.

### Fixed

- `set()` no longer crashes on a partial `colors.levels` config.
- Invalid color keys now fall back to a default instead of emitting `undefined`.
- Circular objects no longer crash logging; falls back to `String(value)`.
- `stringifyPart()` checks `instanceof Error` before `JSON.stringify`, since `JSON.stringify(error)` silently produces `{}`.

### Performance

- `rebuildCache()` precomputes the full colored prefix per level, so `formatMessage` does zero color lookups per call — about 43% faster.
- Timestamp formatting replaced two regex calls with `iso.slice()`.
- `debug()` bails out before argument parsing when disabled.
- `JSON.stringify(part, null, 2)` → `JSON.stringify(part)`.
- Per-second timestamp cache, so repeated calls within the same second skip `new Date().toISOString()`.
- Log methods pass the level literal directly instead of calling `.toLowerCase()`.
- `_reset` cached instead of read from the module constant, so the noColor branch is branch-free at log time.
- Numeric `minLevel` check added before argument parsing.

### Changed

- README examples for default import, named import, and CommonJS require.
- Invalid color values now degrade gracefully instead of crashing.

### Testing

- Added `tests/logger.test.js`, using `node:test`.
- Added a benchmark suite with a 5 µs/call ceiling.

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
