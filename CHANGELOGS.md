# Notable Changes & Versioning
All notable changes to this project will be documented in this file :3

This project adheres to [Semantic Versioning](https://semver.org/) starting `v1.0.2`.


## 1.0.2 [2024-OCT-15]
### Changed
- Class name from `Logger` to `Logena`.

### Fixed
- Class methods, now they're actually accessible from the class instance.

## 1.0.1 [2024-OCT-15]
### Changed
- Moved `logger.js` from `/dist` to project root.
- Update `package.json` to reflect changes.
- Lowered minimum NodeJS version to `14.0.0`, let's be fr, we don't need to be that strict.

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
