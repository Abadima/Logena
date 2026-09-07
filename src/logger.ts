const terminalColors = {
	reset: "\u001B[0m",
	bright: "\u001B[1m",
	dim: "\u001B[2m",
	underscore: "\u001B[4m",
	blink: "\u001B[5m",
	reverse: "\u001B[7m",
	hidden: "\u001B[8m",

	textColors: {
		// Standard ANSI 16 colors (backward compatible)
		black: "\u001B[30m",
		brightBlue: "\u001B[94m",
		brightCyan: "\u001B[96m",
		brightGreen: "\u001B[92m",
		brightRed: "\u001B[91m",
		blue: "\u001B[34m",
		cyan: "\u001B[36m",
		gray: "\u001B[90m",
		green: "\u001B[32m",
		grey: "\u001B[90m",
		magenta: "\u001B[35m",
		pink: "\u001B[95m",
		red: "\u001B[31m",
		white: "\u001B[97m",
		yellow: "\u001B[33m",

		// Extended ANSI 256-color variants (light/dark/rich shades)
		lightGray: "\u001B[38;5;250m",
		darkGray: "\u001B[38;5;59m",
		lightRed: "\u001B[38;5;210m",
		darkRed: "\u001B[38;5;52m",
		lightGreen: "\u001B[38;5;157m",
		darkGreen: "\u001B[38;5;22m",
		lightBlue: "\u001B[38;5;117m",
		darkBlue: "\u001B[38;5;17m",
		lightCyan: "\u001B[38;5;159m",
		darkCyan: "\u001B[38;5;30m",
		lightMagenta: "\u001B[38;5;183m",
		darkMagenta: "\u001B[38;5;55m",
		lightYellow: "\u001B[38;5;227m",
		paleYellow: "\u001B[38;5;187m",
		orange: "\u001B[38;5;214m",
		lightOrange: "\u001B[38;5;216m",

		// Additional useful variants
		teal: "\u001B[38;5;36m",
		lime: "\u001B[38;5;82m",
		navy: "\u001B[38;5;18m",
		maroon: "\u001B[38;5;88m",
		plum: "\u001B[38;5;139m",
		olive: "\u001B[38;5;64m",
		coral: "\u001B[38;5;167m",
		salmon: "\u001B[38;5;173m",
		indigo: "\u001B[38;5;54m",
		violet: "\u001B[38;5;135m",
		khaki: "\u001B[38;5;185m",
		tan: "\u001B[38;5;180m",

		// Semantic color names (intentional, composable)
		success: "\u001B[38;5;82m",
		failure: "\u001B[38;5;167m",
		warning: "\u001B[38;5;214m",
		info: "\u001B[38;5;117m",
		debug: "\u001B[38;5;208m",
		muted: "\u001B[38;5;244m",
		accent: "\u001B[38;5;183m",
		emphasis: "\u001B[1m\u001B[38;5;227m",
	},
} as const;

// Numeric level map: single integer compare per log call eliminates all string ops on the hot path.
const LEVEL_MAP = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type LevelName = keyof typeof LEVEL_MAP;

/**
 * Logger Class
 *
 * A simple logger class that can be used to log messages to the console.
 *
 * @example
 * 	const logger = new Logger();
 *
 * @example
 * 	logger.set({ debug: true, appName: "MyApp", useTimestamps: true });
 *
 * @example
 * 	logger.info("This is a log message");
 *
 * @class Logena
 */
class Logena {
	private static readonly defaultErrorCat: string = " /\\_/\\\n( o.o )\n > ^ <  meow!";
	private static appName = "";
	private static colors: {
		timestamp?: keyof typeof terminalColors.textColors;
		appName?: keyof typeof terminalColors.textColors;
		message?: keyof typeof terminalColors.textColors;
		levels: {
			info: keyof typeof terminalColors.textColors;
			warn: keyof typeof terminalColors.textColors;
			error: keyof typeof terminalColors.textColors;
			debug: keyof typeof terminalColors.textColors;
		};
	} = {
		levels: {
			info: "blue",
			warn: "yellow",
			error: "red",
			debug: "cyan",
		},
	};
	private static debugMode = false;
	private static useTimestamps = false;
	private static meowOnError = false;
	private static errorCatAscii: string = Logena.defaultErrorCat;
	// MinLevel: numeric gate applied before argument parsing -- zero cost when at default (0 = debug).
	private static minLevel = 0;
	// NoColor: strips all ANSI escape codes; useful for CI pipelines and file-based log sinks.
	private static noColor = false;
	// SerializeObjects: false emits type shorthands ([Object], [Array]) -- zero JSON parse cost.
	private static serializeObjects = true;

	private static _prefixCache: { info: string; warn: string; error: string; debug: string } = {
		info: "",
		warn: "",
		error: "",
		debug: "",
	};
	private static _levelPrefixCache: { info: string; warn: string; error: string; debug: string } = {
		info: "",
		warn: "",
		error: "",
		debug: "",
	};
	private static _timestampColor = "";
	private static _appColorOpen = "";
	private static _appColorClose = "";
	// Cached reset code -- empty string when noColor is true, avoids branching inside formatMessage.
	private static _reset: string = terminalColors.reset;
	// Per-second timestamp cache: avoids new Date().toISOString() (~1500 ns) on every log call.
	private static _cachedTimestamp = "";
	private static _cachedTimestampSec = -1;

	private static parseLogArguments(args: unknown[]): { appName?: string; messages: unknown[] } {
		if (
			args.length === 2 &&
			typeof args[1] === "string" &&
			(typeof args[0] === "string" || typeof args[0] === "object")
		) {
			return { appName: args[1], messages: [args[0]] };
		}

		return { messages: args };
	}

	private static stringifyPart(part: unknown): string {
		if (typeof part === "string") {
			return part;
		}
		// Error instances: always emit stack (includes message) -- JSON.stringify drops the stack.
		if (part instanceof Error) {
			return part.stack ?? part.message;
		}
		if (!this.serializeObjects) {
			if (part === null) {
				return "null";
			}
			if (Array.isArray(part)) {
				return "[Array]";
			}
			if (typeof part === "object") {
				return "[Object]";
			}
			return String(part);
		}
		try {
			return JSON.stringify(part);
		} catch {
			return String(part);
		}
	}

	public static set(config: {
		debug?: boolean;
		appName?: string;
		useTimestamps?: boolean;
		meowOnError?: boolean;
		errorCatAscii?: string;
		minLevel?: LevelName;
		noColor?: boolean;
		serializeObjects?: boolean;
		colors?: {
			timestamp?: keyof typeof terminalColors.textColors;
			appName?: keyof typeof terminalColors.textColors;
			message?: keyof typeof terminalColors.textColors;
			levels?: {
				info?: keyof typeof terminalColors.textColors;
				warn?: keyof typeof terminalColors.textColors;
				error?: keyof typeof terminalColors.textColors;
				debug?: keyof typeof terminalColors.textColors;
			};
		};
	}): void {
		if (config.appName !== undefined) {
			this.appName = config.appName;
		}
		if (config.debug !== undefined) {
			this.debugMode = config.debug;
		}
		if (config.useTimestamps !== undefined) {
			this.useTimestamps = config.useTimestamps;
		}
		if (config.meowOnError !== undefined) {
			this.meowOnError = config.meowOnError;
		}
		if (config.errorCatAscii !== undefined) {
			this.errorCatAscii = config.errorCatAscii.trim()
				? config.errorCatAscii
				: Logena.defaultErrorCat;
		}
		if (config.minLevel !== undefined) {
			this.minLevel = LEVEL_MAP[config.minLevel];
		}
		if (config.noColor !== undefined) {
			this.noColor = config.noColor;
		}
		if (config.serializeObjects !== undefined) {
			this.serializeObjects = config.serializeObjects;
		}
		if (config.colors !== undefined) {
			const colorsConfig = config.colors;
			if (colorsConfig.timestamp !== undefined) {
				this.colors.timestamp = colorsConfig.timestamp;
			}
			if (colorsConfig.appName !== undefined) {
				this.colors.appName = colorsConfig.appName;
			}
			if (colorsConfig.message !== undefined) {
				this.colors.message = colorsConfig.message;
			}
			if (colorsConfig.levels !== undefined) {
				const levelsConfig = colorsConfig.levels;
				if (levelsConfig.info !== undefined) {
					this.colors.levels.info = levelsConfig.info;
				}
				if (levelsConfig.warn !== undefined) {
					this.colors.levels.warn = levelsConfig.warn;
				}
				if (levelsConfig.error !== undefined) {
					this.colors.levels.error = levelsConfig.error;
				}
				if (levelsConfig.debug !== undefined) {
					this.colors.levels.debug = levelsConfig.debug;
				}
			}
		}
		this.rebuildCache();
	}

	private static rebuildCache(): void {
		// NoColor path: emit ANSI-free plain text -- shorter strings, no escape code overhead in pipelines.
		if (this.noColor) {
			this._reset = "";
			this._timestampColor = "";
			this._appColorOpen = "[ ";
			this._appColorClose = " ] ";
			const defaultAppPart = this.appName ? `[ ${this.appName} ] ` : "";
			const levels = ["info", "warn", "error", "debug"] as const;
			for (const level of levels) {
				const levelPrefix = `${level.toUpperCase()}: `;
				this._prefixCache[level] = `${defaultAppPart}${levelPrefix}`;
				this._levelPrefixCache[level] = levelPrefix;
			}
			return;
		}
		this._reset = terminalColors.reset;
		const { reset } = terminalColors;
		const appNameColorKey = this.colors.appName ?? "white";
		const appNameColor =
			terminalColors.textColors[appNameColorKey] ?? terminalColors.textColors.white;
		const messageColorKey = this.colors.message ?? "white";
		const messageColor =
			terminalColors.textColors[messageColorKey] ?? terminalColors.textColors.white;
		const timestampColorKey = this.colors.timestamp ?? "white";
		this._timestampColor =
			terminalColors.textColors[timestampColorKey] ?? terminalColors.textColors.white;
		this._appColorOpen = `${appNameColor}[ `;
		this._appColorClose = ` ]${reset} `;
		const defaultAppPart = this.appName
			? `${this._appColorOpen}${this.appName}${this._appColorClose}`
			: "";
		const levels = ["info", "warn", "error", "debug"] as const;
		for (const level of levels) {
			const levelColorKey = this.colors.levels[level];
			const levelColor = terminalColors.textColors[levelColorKey] ?? terminalColors.textColors.blue;
			const levelPrefix = `${levelColor}${level.toUpperCase()}${reset}: ${messageColor}`;
			this._prefixCache[level] = `${defaultAppPart}${levelPrefix}`;
			this._levelPrefixCache[level] = levelPrefix;
		}
	}

	private static _formatTimestamp(): string {
		// Math.floor(Date.now() / 1000) costs ~50 ns but spares the ~1500 ns Date().toISOString() call
		// When the second has not changed -- large net saving during log bursts in the same second.
		const sec = Math.floor(Date.now() / 1000);
		if (sec !== this._cachedTimestampSec) {
			const iso = new Date().toISOString();
			this._cachedTimestamp = `${iso.slice(0, 10)} ${iso.slice(11, 19)}Z`;
			this._cachedTimestampSec = sec;
		}
		return this._cachedTimestamp;
	}

	private static formatMessage(
		level: "info" | "warn" | "error" | "debug",
		messages: unknown[],
		appName?: string,
	): string {
		const ts = this.useTimestamps
			? `${this._timestampColor}${this._formatTimestamp()}${this._reset} `
			: "";
		const prefix = appName
			? `${this._appColorOpen}${appName}${this._appColorClose}${this._levelPrefixCache[level]}`
			: this._prefixCache[level];
		const msg =
			messages.length === 1
				? this.stringifyPart(messages[0])
				: messages.map((part) => this.stringifyPart(part)).join(" ");
		// V8 compiles 4-operand template literals to optimized string concat -- no array allocation needed.
		return `${ts}${prefix}${msg}${this._reset}`;
	}

	/**
	 * Log an info message to the console
	 *
	 * @param (...unknown[]) Args - One or more values to log; supports legacy 2-arg appName override
	 * @returns Void
	 */
	public static info(...args: unknown[]): void {
		if (LEVEL_MAP.info < this.minLevel) {
			return;
		}
		const { appName, messages } = this.parseLogArguments(args);
		console.log(this.formatMessage("info", messages, appName));
	}

	/**
	 * Log a warning to the console
	 *
	 * @param (...unknown[]) Args - One or more values to log; supports legacy 2-arg appName override
	 */
	public static warn(...args: unknown[]): void {
		if (LEVEL_MAP.warn < this.minLevel) {
			return;
		}
		const { appName, messages } = this.parseLogArguments(args);
		console.warn(this.formatMessage("warn", messages, appName));
	}

	/**
	 * Log an error to the console
	 *
	 * @param (...unknown[]) Args - One or more values to log; supports legacy 2-arg appName override
	 */
	public static error(...args: unknown[]): void {
		if (LEVEL_MAP.error < this.minLevel) {
			return;
		}
		const { appName, messages } = this.parseLogArguments(args);
		if (this.meowOnError) {
			console.error(this.errorCatAscii);
		}
		console.error(this.formatMessage("error", messages, appName));
	}

	/**
	 * Log a debug message to the console
	 *
	 * @param (...unknown[]) Args - One or more values to log; supports legacy 2-arg appName override
	 */
	public static debug(...args: unknown[]): void {
		// DebugMode guard first -- cheapest check; avoids minLevel compare in the common false case.
		if (!this.debugMode) {
			return;
		}
		if (LEVEL_MAP.debug < this.minLevel) {
			return;
		}
		const { appName, messages } = this.parseLogArguments(args);
		console.debug(this.formatMessage("debug", messages, appName));
	}

	static {
		Logena.rebuildCache();
	}
}

export { Logena as default, Logena };
export type { LevelName };
