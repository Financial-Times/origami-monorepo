#!/usr/bin/env node

console.log(
	JSON.stringify(
		Object.keys(
			JSON.parse(process.argv[2])
		),
		null,
		"\t"
	)
)
