import bole from "bole";
import { createConsola } from "consola";
import pino from "pino";
import winston from "winston";

import { Logena } from "../dist/logger.js";
import {
	SAMPLE_ERROR,
	SIMPLE_MESSAGE,
	STRUCTURED_PAYLOAD,
	DEBUG_MESSAGE,
	DEBUG_PAYLOAD,
} from "./lib/workloads.mjs";

const adapters = [
	{
		name: "logena",
		create(blackhole) {
			const original = {
				log: console.log,
				warn: console.warn,
				error: console.error,
				debug: console.debug,
			};
			const write = (line) => {
				blackhole.write(`${line}\n`);
			};
			console.log = write;
			console.warn = write;
			console.error = write;
			console.debug = write;

			Logena.set({
				appName: "",
				noColor: true,
				useTimestamps: false,
				debug: true,
				minLevel: "debug",
				serializeObjects: true,
			});

			return {
				instance: Logena,
				teardown() {
					console.log = original.log;
					console.warn = original.warn;
					console.error = original.error;
					console.debug = original.debug;
				},
			};
		},
		scenarios: {
			simple: (logger) => logger.info(SIMPLE_MESSAGE),
			structured: (logger) => logger.warn(STRUCTURED_PAYLOAD),
			error: (logger) => logger.error(SAMPLE_ERROR),
			debug: (logger) => logger.debug(DEBUG_MESSAGE, DEBUG_PAYLOAD),
		},
	},
	{
		name: "pino",
		create(blackhole) {
			return { instance: pino({ level: "debug" }, blackhole) };
		},
		scenarios: {
			simple: (logger) => logger.info(SIMPLE_MESSAGE),
			structured: (logger) => logger.warn(STRUCTURED_PAYLOAD, "request failed"),
			error: (logger) => logger.error(SAMPLE_ERROR),
			debug: (logger) => logger.debug(DEBUG_PAYLOAD, DEBUG_MESSAGE),
		},
	},
	{
		name: "winston",
		create(blackhole) {
			const instance = winston.createLogger({
				level: "debug",
				format: winston.format.json(),
				transports: [new winston.transports.Stream({ stream: blackhole })],
			});
			return { instance };
		},
		scenarios: {
			simple: (logger) => logger.info(SIMPLE_MESSAGE),
			structured: (logger) => logger.warn({ message: "request failed", ...STRUCTURED_PAYLOAD }),
			error: (logger) => logger.error(SAMPLE_ERROR),
			debug: (logger) => logger.debug({ message: DEBUG_MESSAGE, ...DEBUG_PAYLOAD }),
		},
	},
	{
		name: "bole",
		create(blackhole) {
			bole.reset();
			bole.output({ level: "debug", stream: blackhole });
			return { instance: bole("bench"), teardown: () => bole.reset() };
		},
		scenarios: {
			simple: (logger) => logger.info(SIMPLE_MESSAGE),
			structured: (logger) => logger.warn(STRUCTURED_PAYLOAD, "request failed"),
			error: (logger) => logger.error(SAMPLE_ERROR),
			debug: (logger) => logger.debug(DEBUG_PAYLOAD, DEBUG_MESSAGE),
		},
	},
	{
		name: "consola",
		create(blackhole) {
			const instance = createConsola({
				level: 5,
				reporters: [
					{
						log(logObj) {
							blackhole.write(`${JSON.stringify(logObj.args)}\n`);
						},
					},
				],
			});
			return { instance };
		},
		scenarios: {
			simple: (logger) => logger.info(SIMPLE_MESSAGE),
			structured: (logger) => logger.warn(STRUCTURED_PAYLOAD),
			error: (logger) => logger.error(SAMPLE_ERROR),
			debug: (logger) => logger.debug(DEBUG_MESSAGE, DEBUG_PAYLOAD),
		},
	},
];

export { adapters };
