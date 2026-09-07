const SIMPLE_MESSAGE = "User authenticated successfully";

const STRUCTURED_PAYLOAD = Object.freeze({
	reqId: "r69",
	method: "GET",
	url: "https://api.jena.systems/health",
	statusCode: 200,
	latencyMs: 67,
});

const DEBUG_MESSAGE = "Yo, check out https://abadima.dev !";

const DEBUG_PAYLOAD = Object.freeze({
	table: "users",
	rows: 420,
});

const SAMPLE_ERROR = new Error("ECONNREFUSED: connection refused to 127.0.0.1:1738");

export { SIMPLE_MESSAGE, STRUCTURED_PAYLOAD, DEBUG_MESSAGE, DEBUG_PAYLOAD, SAMPLE_ERROR };
