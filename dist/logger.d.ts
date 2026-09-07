declare const terminalColors: {
    readonly reset: "\u001B[0m";
    readonly bright: "\u001B[1m";
    readonly dim: "\u001B[2m";
    readonly underscore: "\u001B[4m";
    readonly blink: "\u001B[5m";
    readonly reverse: "\u001B[7m";
    readonly hidden: "\u001B[8m";
    readonly textColors: {
        readonly black: "\u001B[30m";
        readonly brightBlue: "\u001B[94m";
        readonly brightCyan: "\u001B[96m";
        readonly brightGreen: "\u001B[92m";
        readonly brightRed: "\u001B[91m";
        readonly blue: "\u001B[34m";
        readonly cyan: "\u001B[36m";
        readonly gray: "\u001B[90m";
        readonly green: "\u001B[32m";
        readonly grey: "\u001B[90m";
        readonly magenta: "\u001B[35m";
        readonly pink: "\u001B[95m";
        readonly red: "\u001B[31m";
        readonly white: "\u001B[97m";
        readonly yellow: "\u001B[33m";
        readonly lightGray: "\u001B[38;5;250m";
        readonly darkGray: "\u001B[38;5;59m";
        readonly lightRed: "\u001B[38;5;210m";
        readonly darkRed: "\u001B[38;5;52m";
        readonly lightGreen: "\u001B[38;5;157m";
        readonly darkGreen: "\u001B[38;5;22m";
        readonly lightBlue: "\u001B[38;5;117m";
        readonly darkBlue: "\u001B[38;5;17m";
        readonly lightCyan: "\u001B[38;5;159m";
        readonly darkCyan: "\u001B[38;5;30m";
        readonly lightMagenta: "\u001B[38;5;183m";
        readonly darkMagenta: "\u001B[38;5;55m";
        readonly lightYellow: "\u001B[38;5;227m";
        readonly paleYellow: "\u001B[38;5;187m";
        readonly orange: "\u001B[38;5;214m";
        readonly lightOrange: "\u001B[38;5;216m";
        readonly teal: "\u001B[38;5;36m";
        readonly lime: "\u001B[38;5;82m";
        readonly navy: "\u001B[38;5;18m";
        readonly maroon: "\u001B[38;5;88m";
        readonly plum: "\u001B[38;5;139m";
        readonly olive: "\u001B[38;5;64m";
        readonly coral: "\u001B[38;5;167m";
        readonly salmon: "\u001B[38;5;173m";
        readonly indigo: "\u001B[38;5;54m";
        readonly violet: "\u001B[38;5;135m";
        readonly khaki: "\u001B[38;5;185m";
        readonly tan: "\u001B[38;5;180m";
        readonly success: "\u001B[38;5;82m";
        readonly failure: "\u001B[38;5;167m";
        readonly warning: "\u001B[38;5;214m";
        readonly info: "\u001B[38;5;117m";
        readonly debug: "\u001B[38;5;208m";
        readonly muted: "\u001B[38;5;244m";
        readonly accent: "\u001B[38;5;183m";
        readonly emphasis: "\u001B[1m\u001B[38;5;227m";
    };
};
declare const LEVEL_MAP: {
    readonly debug: 0;
    readonly info: 1;
    readonly warn: 2;
    readonly error: 3;
};
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
declare class Logena {
    private static readonly defaultErrorCat;
    private static appName;
    private static colors;
    private static debugMode;
    private static useTimestamps;
    private static meowOnError;
    private static errorCatAscii;
    private static minLevel;
    private static noColor;
    private static serializeObjects;
    private static _prefixCache;
    private static _levelPrefixCache;
    private static _timestampColor;
    private static _appColorOpen;
    private static _appColorClose;
    private static _reset;
    private static _cachedTimestamp;
    private static _cachedTimestampSec;
    private static parseLogArguments;
    private static stringifyPart;
    static set(config: {
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
    }): void;
    private static rebuildCache;
    private static _formatTimestamp;
    private static formatMessage;
    /**
     * Log an info message to the console
     *
     * @param (...unknown[]) Args - One or more values to log; supports legacy 2-arg appName override
     * @returns Void
     */
    static info(...args: unknown[]): void;
    /**
     * Log a warning to the console
     *
     * @param (...unknown[]) Args - One or more values to log; supports legacy 2-arg appName override
     */
    static warn(...args: unknown[]): void;
    /**
     * Log an error to the console
     *
     * @param (...unknown[]) Args - One or more values to log; supports legacy 2-arg appName override
     */
    static error(...args: unknown[]): void;
    /**
     * Log a debug message to the console
     *
     * @param (...unknown[]) Args - One or more values to log; supports legacy 2-arg appName override
     */
    static debug(...args: unknown[]): void;
}
export { Logena as default, Logena };
export type { LevelName };
