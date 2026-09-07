![Logena](assets/logena.webp)
I've made this simple logging system to help keep my logging consistent across projects. While unoriginal, it's a somewhat decent package for those looking for the same ideas I had in mind, since this one's a little different from others I've wanted to use.

## Features

- ✅ Customizable application name.
- ✅ Customizable colors for everything.
- ✅ No Dependencies, very demure.
- ✅ Optional Debug mode.
- ✅ Optional ASCII kitty meow on errors.

# Installation

This can be made via your package manager of choice, here's npm as an example:

```bash
npm install logena
```

# Functions

### `logena.set`

#### Parameters

- `config`: An object containing configuration options.
- `debug` (optional): `boolean` - Enable or disable debug mode.
- `appName` (optional): `string` - Set the application name.
- `useTimestamps` (optional): `boolean` - Enable or disable timestamps in logs.
- `meowOnError` (optional): `boolean` - When `true`, prints an ASCII kitty before error logs.
- `errorCatAscii` (optional): `string` - Custom ASCII cat text shown when `meowOnError` is enabled.
- `colors` (optional): `object` - Customize colors.
- `timestamp`: `string` - Color for the timestamp.
- `appName`: `string` - Color for the application name.
- `message`: `string` - Color for the message.
- `levels`: `object` - Customize colors for different log levels.
- `info`: `string` - Color for info level logs.
- `warn`: `string` - Color for warn level logs.
- `error`: `string` - Color for error level logs.
- `debug`: `string` - Color for debug level logs.

### `logena.info`

#### Parameters

- `appName` (optional): `string` - Set the application name (Overrides preset name).
- `message`: `string | object` - The message to log.

### `logena.warn`

#### Parameters

- `appName` (optional): `string` - Set the application name (Overrides preset name).
- `message`: `string | object` - The message to log.

### `logena.error`

#### Parameters

- `appName` (optional): `string` - Set the application name (Overrides preset name).
- `message`: `string | object` - The message to log.

### `logena.debug` (ONLY LOGS IF DEBUG MODE IS ENABLED VIA `logena.set`)

#### Parameters

- `appName` (optional): `string` - Set the application name (Overrides preset name).
- `message`: `string | object` - The message to log.

---

> **Note:** If you set `appName` on any log level function (e.g., `logena.info`, `logena.warn`, etc.), it will override the preset application name only for that specific function call.

# JS/TS Examples

Both default and named imports work in TypeScript. CommonJS supports destructuring or default require.

```ts
// TypeScript: default import
import Logena from "logena";
// TypeScript: named import (also works)
import { Logena } from "logena";
// JavaScript/CommonJS: destructured require
const { Logena } = require("logena");
```

Then configure and use:

```js
Logena.set({
	debug: true,
	appName: "LOGENA",
	meowOnError: true,
	colors: {
		appName: "red",
		levels: {
			info: "green",
		},
	},
	useTimestamps: true,
});
Logena.info("Hello, world!"); // 2024-10-15 18:00:00Z [LOGENA] INFO: Hello, world!
Logena.warn("Hello, world!"); // 2024-10-15 18:00:00Z [LOGENA] WARN: Hello, world!
Logena.error("Hello, world!"); // 2024-10-15 18:00:00Z [LOGENA] ERROR: Hello, world!
Logena.debug("Hello, world!"); // 2024-10-15 18:00:00Z [LOGENA] DEBUG: Hello, world!
```

# Performance

Benchmarked against various competitors: 50,000 iterations x 3 trials per scenario (median of trials). Measured on an AMD Ryzen 9 9950X3D running Ubuntu 26.04.

Average across four scenarios (simple string, structured object, error object, debug):

| Logger  | Median | p95    | p99    | Ops/sec   | RSS growth | vs logena    |
| ------- | ------ | ------ | ------ | --------- | ---------- | ------------ |
| logena  | 490 ns | 595 ns | 728 ns | 2,136,840 | +0.250 MB  | reference    |
| consola | 530 ns | 548 ns | 560 ns | 1,940,524 | +0.000 MB  | 1.08x slower |
| pino    | 1.0 us | 1.1 us | 1.4 us | 1,070,631 | +0.219 MB  | 2.10x slower |
| winston | 1.1 us | 1.6 us | 2.0 us | 964,876   | +49.500 MB | 2.18x slower |
| bole    | 1.2 us | 1.4 us | 1.8 us | 853,310   | +0.754 MB  | 2.51x slower |

> These are aggregate averages; per-scenario numbers vary (consola, for example, is faster than logena on structured and debug logging but slower overall). Run `npm run benchmark` to reproduce, and see [`benchmarks/`](benchmarks) for the full per-scenario breakdown and methodology.

# License

MIT :3

# Contributing

Want to contribute? Feel free to fork and make a pull request! Every contribution will be reviewed and appreciated.

## Hall of Contributors

- None yet, be the first?
