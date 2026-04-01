"use strict";

const { test, describe, before, beforeEach, after } = require("node:test");
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

    test("named and default exports both work", () => {
        const pkg = require("../dist/logger");
        assert.equal(typeof pkg.Logena.info, "function");
        assert.strictEqual(pkg.default, pkg.Logena);
    });
});

describe("Performance benchmarks (runs only when functional tests pass)", () => {
    const ITERATIONS = 100_000;
    const MAX_MEDIAN_NS = 5_000;
    const RSS_LIMIT_MB = 16;
    const results = {};
    let skipBenchmarks = false;

    const original = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        debug: console.debug
    };

    function benchmark(fn) {
        for (let i = 0; i < 2000; i++) fn();
        const samples = new Float64Array(ITERATIONS);
        for (let i = 0; i < ITERATIONS; i++) {
            const t0 = process.hrtime.bigint();
            fn();
            samples[i] = Number(process.hrtime.bigint() - t0);
        }
        samples.sort();
        const median = samples[Math.floor(ITERATIONS * 0.5)];
        const p95 = samples[Math.floor(ITERATIONS * 0.95)];
        const p99 = samples[Math.floor(ITERATIONS * 0.99)];
        const mean = samples.reduce((acc, value) => acc + value, 0) / ITERATIONS;
        return { median, p95, p99, mean, opsPerSec: Math.round(1e9 / median) };
    }

    function fmtNs(value) {
        if (value < 1000) return `${Math.round(value)} ns`;
        if (value < 1_000_000) return `${(value / 1000).toFixed(1)} us`;
        return `${(value / 1_000_000).toFixed(2)} ms`;
    }

    before(() => {
        if (process.exitCode === 1) {
            skipBenchmarks = true;
            return;
        }
        Logena.set({
            appName: "",
            noColor: true,
            useTimestamps: false,
            debug: true,
            minLevel: "debug",
            serializeObjects: true
        });

        console.log = () => { };
        console.warn = () => { };
        console.error = () => { };
        console.debug = () => { };
    });

    after(() => {
        console.log = original.log;
        console.warn = original.warn;
        console.error = original.error;
        console.debug = original.debug;
    });

    test("bench info", (t) => {
        if (skipBenchmarks) return t.skip("Functional tests failed");
        const rss0 = process.memoryUsage().rss;
        const data = benchmark(() => Logena.info("User authenticated successfully"));
        data.rssMb = Math.max(0, process.memoryUsage().rss - rss0) / (1024 * 1024);
        results.info = data;
    });

    test("bench warn", (t) => {
        if (skipBenchmarks) return t.skip("Functional tests failed");
        const payload = { reqId: "r1", method: "POST", url: "/api/v2/users", statusCode: 422, latencyMs: 87 };
        const rss0 = process.memoryUsage().rss;
        const data = benchmark(() => Logena.warn(payload));
        data.rssMb = Math.max(0, process.memoryUsage().rss - rss0) / (1024 * 1024);
        results.warn = data;
    });

    test("bench error", (t) => {
        if (skipBenchmarks) return t.skip("Functional tests failed");
        const error = new Error("ECONNREFUSED: connection refused to 127.0.0.1:5432");
        const rss0 = process.memoryUsage().rss;
        const data = benchmark(() => Logena.error(error));
        data.rssMb = Math.max(0, process.memoryUsage().rss - rss0) / (1024 * 1024);
        results.error = data;
    });

    test("bench debug", (t) => {
        if (skipBenchmarks) return t.skip("Functional tests failed");
        const rss0 = process.memoryUsage().rss;
        const data = benchmark(() => Logena.debug("DB query finished", { table: "users", rows: 128 }, 8));
        data.rssMb = Math.max(0, process.memoryUsage().rss - rss0) / (1024 * 1024);
        results.debug = data;
    });

    test("print benchmark summary and assert thresholds", (t) => {
        if (skipBenchmarks) return t.skip("Functional tests failed");

        console.log = original.log;
        const levels = ["info", "warn", "error", "debug"];

        process.stdout.write("\nLOGENA BENCHMARK SUMMARY (100000 iterations per level, console I/O suppressed)\n");
        process.stdout.write("level   median    p95       p99       mean      ops/sec      RSS MB\n");
        process.stdout.write("---------------------------------------------------------------------\n");

        let totalRss = 0;
        for (const level of levels) {
            const item = results[level];
            totalRss += item.rssMb;
            process.stdout.write(
                `${level.padEnd(6)} ${fmtNs(item.median).padEnd(9)} ${fmtNs(item.p95).padEnd(9)} ${fmtNs(item.p99).padEnd(9)} ${fmtNs(item.mean).padEnd(9)} ${String(item.opsPerSec).padEnd(11)} +${item.rssMb.toFixed(3)}\n`
            );
            assert.ok(item.median < MAX_MEDIAN_NS, `${level} median ${fmtNs(item.median)} exceeds ${fmtNs(MAX_MEDIAN_NS)}`);
        }

        process.stdout.write("---------------------------------------------------------------------\n");
        process.stdout.write(`Total RSS growth: +${totalRss.toFixed(3)} MB\n\n`);

        assert.ok(totalRss < RSS_LIMIT_MB, `Total RSS growth ${totalRss.toFixed(2)} MB exceeds ${RSS_LIMIT_MB} MB`);

        console.log = () => { };
    });
});
