import { openSync, writeSync } from "node:fs";
import { Writable } from "node:stream";

const createBlackhole = () => {
	const fd = openSync("/dev/null", "w");
	return new Writable({
		write(chunk, _encoding, callback) {
			writeSync(fd, chunk);
			callback();
		},
	});
};

export { createBlackhole };
