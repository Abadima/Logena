"use strict";

const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { Logena } = require("../dist/logger");

function capture(method, fn) {
    const lines = [];
    const original = console[method];
    console[method] = (...args) => lines.push(args.join(""));
    try {
        fn();
    } finally {
        console[method] = original;
    }
    return lines;
}

function reset() {
    Logena.set({
        appName: "",
        debug: false,
        useTimestamps: false,
        meowOnError: false,
        noColor: true,
        serializeObjects: true,
        minLevel: "debug",
        colors: {
            timestamp: "white",
            appName: "white",
            message: "white",
            levels: { info: "blue", warn: "yellow", error: "red", debug: "cyan" }
        }
    });
}

describe("Functional tests", () => {
    beforeEach(reset);

    test("log levels route to correct console methods", () => {
        assert.equal(capture("log", () => Logena.info("i")).length, 1);
        assert.equal(capture("warn", () => Logena.warn("w")).length, 1);
        assert.equal(capture("error", () => Logena.error("e")).length, 1);
        assert.equal(capture("debug", () => Logena.debug("d")).length, 0);

        Logena.set({ debug: true });
        assert.equal(capture("debug", () => Logena.debug("d")).length, 1);
    });

    test("legacy per-call appName override works", () => {
        Logena.set({ appName: "GLOBAL" });
        const lines = capture("log", () => Logena.info("msg", "LOCAL"));
        assert.ok(lines[0].includes("LOCAL"));
        assert.ok(!lines[0].includes("GLOBAL"));
    });

    test("minLevel filtering works for all bands", () => {
        Logena.set({ minLevel: "warn" });
        assert.equal(capture("log", () => Logena.info("filtered")).length, 0);
        assert.equal(capture("warn", () => Logena.warn("ok")).length, 1);
        assert.equal(capture("error", () => Logena.error("ok")).length, 1);

        Logena.set({ minLevel: "info", debug: true });
        assert.equal(capture("debug", () => Logena.debug("filtered")).length, 0);
    });

    test("noColor strips ANSI and color mode can be re-enabled", () => {
        Logena.set({ noColor: true });
        const plain = capture("log", () => Logena.info("plain"))[0];
        assert.ok(!plain.includes("\x1b"));

        Logena.set({ noColor: false });
        const colored = capture("log", () => Logena.info("colored"))[0];
        assert.ok(colored.includes("\x1b"));
    });

    test("serializeObjects false emits shorthands", () => {
        Logena.set({ serializeObjects: false });
        assert.ok(capture("log", () => Logena.info({ a: 1 }))[0].includes("[Object]"));
        assert.ok(capture("log", () => Logena.info([1, 2]))[0].includes("[Array]"));
        assert.ok(capture("log", () => Logena.info(null))[0].includes("null"));
    });

    test("Error is serialized with message/stack", () => {
        const line = capture("error", () => Logena.error(new Error("boom")))[0];
        assert.ok(line.includes("boom"));
        assert.ok(!line.includes("[object Object]"));
    });

    test("circular object does not crash", () => {
        const obj = { a: 1 };
        obj.self = obj;
        assert.doesNotThrow(() => capture("log", () => Logena.info(obj)));
    });

    test("timestamp cache returns same second prefix", () => {
        Logena.set({ useTimestamps: true, noColor: true });
        const timestamps = [];
        const original = console.log;
        console.log = (line) => timestamps.push(String(line).slice(0, 20));
        try {
            Logena.info("first");
            Logena.info("second");
        } finally {
            console.log = original;
        }
        assert.equal(timestamps[0], timestamps[1]);
    });

    test("meowOnError emits cat before the error line", () => {
        Logena.set({ meowOnError: true, errorCatAscii: "=^.^=" });
        const lines = [];
        const original = console.error;
        console.error = (line) => lines.push(String(line));
        try {
            Logena.error("cat");
        } finally {
            console.error = original;
        }
        assert.equal(lines.length, 2);
        assert.equal(lines[0], "=^.^=");
    });

    test("partial color config merges safely", () => {
        Logena.set({ noColor: false, colors: { levels: { info: "lime" } } });
        assert.doesNotThrow(() => {
            capture("warn", () => Logena.warn("warn"));
            capture("error", () => Logena.error("error"));
        });
    });

    test("multiple arguments are space-joined in order", () => {
        const line = capture("log", () => Logena.info("a", 1, true, null))[0];
        assert.equal(line, "INFO: a 1 true null");
    });

    test("timestamp cache is invalidated when color mode changes", () => {
        Logena.set({ useTimestamps: true, noColor: true });
        const plain = capture("log", () => Logena.info("plain"))[0];
        assert.ok(!plain.includes("\x1b"));

        // Within the same wall-clock second, so this only passes if changing colors invalidates
        // the cached timestamp segment rather than serving the stale plain-text one.
        Logena.set({ noColor: false });
        const colored = capture("log", () => Logena.info("colored"))[0];
        assert.ok(colored.startsWith("\x1b"));
    });

    test("named and default exports both work", () => {
        const pkg = require("../dist/logger");
        assert.equal(typeof pkg.Logena.info, "function");
        assert.strictEqual(pkg.default, pkg.Logena);
    });
});
