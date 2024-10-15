import {readdir, readFileSync, writeFileSync} from "fs";
import {minify} from "uglify-js";

const directories = ["dist/", "dist/src/"];

directories.forEach(directory => {
	readdir(directory, (err, files) => {
		if (err) return console.error(err);

		files.forEach(file => {
			if (file.endsWith(".js")) {
				const filePath = directory + file;
				const result = minify(readFileSync(filePath, "utf8"), {
					compress: {
						collapse_vars: true,
						if_return: true,
						hoist_funs: true,
						hoist_vars: true,
						join_vars: true,
						negate_iife: true,
						passes: 2,
						pure_funcs: [
							"classCallCheck",
							"_classCallCheck",
							"_possibleConstructorReturn",
							"Object.freeze",
							"invariant",
							"warning"
						],
						reduce_funcs: true,
						reduce_vars: true
					},
					output: {comments: /^!|@returns/},
					keep_fargs: false
				});

				if (result.error) return console.error(`Error compressing ${file}: ${result.error}`);
				writeFileSync(filePath, result.code, "utf8");
			}
		});
	});
	console.log("[INFO] Compressed Files in", directory);
});