const WARMUP_ITERATIONS = 2000;

const forceGc = () => {
	if (typeof globalThis.gc === "function") {
		globalThis.gc();
	}
};

const requireExposedGc = () => {
	if (typeof globalThis.gc !== "function") {
		throw new TypeError(
			"Benchmarks need deterministic GC for reliable RSS numbers. Re-run with: node --expose-gc benchmarks/run.mjs",
		);
	}
};

const summarize = (samples) => {
	const count = samples.length;
	const sorted = samples.toSorted((first, second) => first - second);
	const median = sorted[Math.floor(count * 0.5)];
	const p95 = sorted[Math.floor(count * 0.95)];
	const p99 = sorted[Math.min(count - 1, Math.floor(count * 0.99))];
	let sum = 0;
	for (let index = 0; index < count; index += 1) {
		sum += sorted[index];
	}
	const mean = sum / count;
	return { median, p95, p99, mean, opsPerSec: Math.round(1e9 / median) };
};

const benchmarkScenario = (fn, iterations) => {
	for (let index = 0; index < WARMUP_ITERATIONS; index += 1) {
		fn();
	}

	forceGc();
	const rss0 = process.memoryUsage().rss;

	const samples = new Float64Array(iterations);
	for (let index = 0; index < iterations; index += 1) {
		const start = process.hrtime.bigint();
		fn();
		samples[index] = Number(process.hrtime.bigint() - start);
	}

	forceGc();
	const rss1 = process.memoryUsage().rss;

	const stats = summarize(samples);
	stats.rssMb = Math.max(0, rss1 - rss0) / (1024 * 1024);
	return stats;
};

const median = (values) => {
	const sorted = values.toSorted((first, second) => first - second);
	return sorted[Math.floor(sorted.length * 0.5)];
};

const runTrials = (fn, iterations, trials) => {
	const runs = [];
	for (let trial = 0; trial < trials; trial += 1) {
		runs.push(benchmarkScenario(fn, iterations));
	}
	return {
		median: median(runs.map((run) => run.median)),
		p95: median(runs.map((run) => run.p95)),
		p99: median(runs.map((run) => run.p99)),
		mean: median(runs.map((run) => run.mean)),
		opsPerSec: Math.round(median(runs.map((run) => run.opsPerSec))),
		rssMb: median(runs.map((run) => run.rssMb)),
	};
};

const fmtNs = (value) => {
	if (value < 1000) {
		return `${Math.round(value)} ns`;
	}
	if (value < 1_000_000) {
		return `${(value / 1000).toFixed(1)} us`;
	}
	return `${(value / 1_000_000).toFixed(2)} ms`;
};

const fmtOps = (value) => value.toLocaleString("en-US");

export { forceGc, requireExposedGc, runTrials, fmtNs, fmtOps };
