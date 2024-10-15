const terminalColors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	dim: "\x1b[2m",
	underscore: "\x1b[4m",
	blink: "\x1b[5m",
	reverse: "\x1b[7m",
	hidden: "\x1b[8m",

	textColors: {
		black: "\x1b[30m",
		brightBlue: "\x1b[94m",
		brightCyan: "\x1b[96m",
		brightGreen: "\x1b[92m",
		brightRed: "\x1b[91m",
		blue: "\x1b[34m",
		cyan: "\x1b[36m",
		gray: "\x1b[90m",
		green: "\x1b[32m",
		grey: "\x1b[90m",
		magenta: "\x1b[35m",
		pink: "\x1b[95m",
		red: "\x1b[31m",
		white: "\x1b[97m",
		yellow: "\x1b[33m",
	}
};

/**
 * Logger Class
 * @class Logger
 * @description A simple logger class that can be used to log messages to the console.
 * @example const logger = new Logger();
 * @example logger.set({ debug: true, appName: 'MyApp', useTimestamps: true });
 * @example logger.info('This is a log message');
 */
class Logger {
	private appName: string = "";
	private colors: {
        timestamp?: keyof typeof terminalColors.textColors,
        appName?: keyof typeof terminalColors.textColors,
        message?: keyof typeof terminalColors.textColors,
        levels: {
            info: keyof typeof terminalColors.textColors,
            warn: keyof typeof terminalColors.textColors,
            error: keyof typeof terminalColors.textColors,
            debug: keyof typeof terminalColors.textColors
        }
    } = {
			levels: {
				info: "blue",
				warn: "yellow",
				error: "red",
				debug: "cyan"
			}
		};
	private debugMode: boolean = false;
	private useTimestamps: boolean = false;


	set(config: { 
        debug?: boolean, 
        appName?: string, 
        useTimestamps?: boolean, 
        colors?: {
            timestamp?: keyof typeof terminalColors.textColors,
            appName?: keyof typeof terminalColors.textColors,
            message?: keyof typeof terminalColors.textColors,
            levels?: {
                info?: keyof typeof terminalColors.textColors,
                warn?: keyof typeof terminalColors.textColors,
                error?: keyof typeof terminalColors.textColors,
                debug?: keyof typeof terminalColors.textColors
            }
        } 
    }): void {
		if (config.appName !== undefined) this.appName = config.appName;
		if (config.debug !== undefined) this.debugMode = config.debug;
		if (config.useTimestamps !== undefined) this.useTimestamps = config.useTimestamps;
		if (config.colors !== undefined) {
			this.colors = {
				...this.colors,
				...config.colors,
				levels: {
					...this.colors.levels,
					...config.colors.levels
				}
			};
		}
	}

	private formatMessage(level: string, message: string | object): string {
		const formatTimestamp = (date: Date): string => date.toISOString().replace("T", " ").replace(/\..+/, "Z");

		const timestamp = this.useTimestamps ? `${terminalColors.textColors[this.colors.timestamp || "white"]}${formatTimestamp(new Date())}${terminalColors.reset} ` : "";
		const app = this.appName ? `${terminalColors.textColors[this.colors.appName || "white"]}[ ${this.appName} ]${terminalColors.reset} ` : "";
		const msg = typeof message === "string" ? message : JSON.stringify(message, null, 2);
		const levelColor = terminalColors.textColors[this.colors.levels[level.toLowerCase() as keyof typeof this.colors.levels]];
		return `${timestamp}${app}${levelColor}${level.toUpperCase()}${terminalColors.reset}: ${terminalColors.textColors[this.colors.message || "white"]}${msg}${terminalColors.reset}`;
	}

	/**
     * Log an info message to the console
     * @param (string | object) message - The message to log
     * @returns void
     */
	info(message: string | object): void {
		console.log(this.formatMessage("INFO", message));
	}

	/**
     * Log a warning to the console
     * @param (string | object) message - The message to log
     */
	warn(message: string | object): void {
		console.warn(this.formatMessage("WARN", message));
	}

	/**
     * Log an error to the console
     * @param (string | object) message - The message to log
     */
	error(message: string | object): void {
		console.error(this.formatMessage("ERROR", message));
	}

	/**
     * Log a debug message to the console
     * @param (string | object) message - The message to log
     */
	debug(message: string | object): void {
		if (this.debugMode) {
			console.debug(this.formatMessage("DEBUG", message));
		}
	}
}

export default new Logger();