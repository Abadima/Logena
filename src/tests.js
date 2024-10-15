"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../logger");
logger_1.Logena.set({
    appName: "LOGENA",
    colors: {
        appName: "brightGreen",
        timestamp: "black",
    },
    debug: true,
    useTimestamps: true
});
logger_1.Logena.info("This is an info message");
logger_1.Logena.warn("This is a warning message");
logger_1.Logena.error("This is an error message");
