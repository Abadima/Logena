import {Logena} from "../logger";

Logena.set({
	appName: "LOGENA", 
	colors: {
		appName: "brightGreen",
		timestamp: "black",
	},
	debug: true, 
	useTimestamps: true
});

Logena.info("This is an info message");
Logena.warn("This is a warning message");
Logena.error("This is an error message");