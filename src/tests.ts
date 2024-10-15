import Logger from "../logger";

Logger.set({
	appName: "LOGENA", 
	colors: {
		appName: "brightGreen",
		timestamp: "black",
	},
	debug: true, 
	useTimestamps: true
});

Logger.info("This is an info message");
Logger.warn("This is a warning message");
Logger.error("This is an error message");
