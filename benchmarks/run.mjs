import { adapters } from "./adapters.mjs";
import { createBlackhole } from "./lib/blackhole.mjs";
import { runTrials, fmtNs, fmtOps, requireExposedGc } from "./lib/stats.mjs";

requireExposedGc();

const ITERATIONS = 50_000;
const TRIALS = 3;

const SCENARIOS = [
	{ key: "simple", label: "simple string" },
	{ key: "structured", label: "structured object" },
	{ key: "error", label: "error object" },
	{ key: "debug", label: "debug" },
];

const supportsScenario = (adapter, key) => typeof adapter.scenarios[key] === "function";

const runAdapter = (adapter) => {
	const scenarioResults = {};
	for (const { key } of SCENARIOS) {
		if (supportsScenario(adapter, key)) {
			const blackhole = createBlackhole();
			const { instance, teardown } = adapter.create(blackhole);
			const call = adapter.scenarios[key];
			scenarioResults[key] = runTrials(() => call(instance), ITERATIONS, TRIALS);
			if (teardown) {
				teardown();
			}
			blackhole.end();
		}
	}
	return scenarioResults;
};

const relativeToBaseline = (baselineMedian, median) => {
	if (median === baselineMedian) {
		return "reference";
	}
	if (median > baselineMedian) {
		return `${(median / baselineMedian).toFixed(2)}x slower`;
	}
	return `${(baselineMedian / median).toFixed(2)}x faster`;
};

const averageStats = (statsList) => {
	const count = statsList.length;
	const sumBy = (pick) => statsList.reduce((total, stats) => total + pick(stats), 0);
	return {
		median: sumBy((stats) => stats.median) / count,
		p95: sumBy((stats) => stats.p95) / count,
		p99: sumBy((stats) => stats.p99) / count,
		mean: sumBy((stats) => stats.mean) / count,
		opsPerSec: Math.round(sumBy((stats) => stats.opsPerSec) / count),
		retainedMb: sumBy((stats) => stats.retainedMb) / count,
	};
};

const printStatsTable = (title, rows) => {
	const baseline = rows.find((row) => row.name === "logena").stats;

	process.stdout.write(`\n${title}\n`);
	process.stdout.write(
		"logger    median    p95       p99       mean      ops/sec       retained MB  vs logena\n",
	);
	process.stdout.write(`${"-".repeat(90)}\n`);

	for (const { name, stats } of rows) {
		const relativeLabel =
			name === "logena" ? "reference" : relativeToBaseline(baseline.median, stats.median);
		process.stdout.write(
			`${name.padEnd(9)} ${fmtNs(stats.median).padEnd(9)} ${fmtNs(stats.p95).padEnd(9)} ${fmtNs(stats.p99).padEnd(9)} ${fmtNs(stats.mean).padEnd(9)} ${fmtOps(stats.opsPerSec).padEnd(13)} +${stats.retainedMb.toFixed(3).padEnd(11)} ${relativeLabel}\n`,
		);
	}
};

const printMemoryTable = (results) => {
	const columnWidth = Math.max(10, ...SCENARIOS.map((scenario) => scenario.label.length + 1));

	process.stdout.write("\nmemory (retained heap in MB per scenario, after forced GC)\n");
	process.stdout.write(
		`logger    ${SCENARIOS.map((scenario) => scenario.label.padEnd(columnWidth)).join("")}total\n`,
	);
	process.stdout.write(`${"-".repeat(10 + columnWidth * SCENARIOS.length + 6)}\n`);

	for (const adapter of adapters) {
		const perScenario = SCENARIOS.map(({ key }) => results[adapter.name][key]?.retainedMb);
		const total = perScenario.reduce((sum, value) => sum + (value ?? 0), 0);
		const cells = perScenario.map((value) =>
			value === undefined ? "n/a".padEnd(columnWidth) : `+${value.toFixed(3)}`.padEnd(columnWidth),
		);
		process.stdout.write(`${adapter.name.padEnd(10)}${cells.join("")}+${total.toFixed(3)}\n`);
	}
};

const results = {};
for (const adapter of adapters) {
	results[adapter.name] = runAdapter(adapter);
}

for (const { key, label } of SCENARIOS) {
	const rows = adapters
		.filter((adapter) => results[adapter.name][key] !== undefined)
		.map((adapter) => ({ name: adapter.name, stats: results[adapter.name][key] }));
	printStatsTable(
		`${label} (${fmtOps(ITERATIONS)} iterations x ${TRIALS} trials, output to /dev/null)`,
		rows,
	);
}

const overviewRows = adapters.map((adapter) => ({
	name: adapter.name,
	stats: averageStats(Object.values(results[adapter.name])),
}));
printStatsTable(`overview (average across ${SCENARIOS.length} scenarios)`, overviewRows);

printMemoryTable(results);
process.stdout.write("\n");
