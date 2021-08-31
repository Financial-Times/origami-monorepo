#!/usr/bin/env node
import {$} from "zx"

let outputs = JSON.parse(process.argv[2])

for (let key in outputs) {
	let value = outputs[key]
	let name = key.match(/^components\/(.*)--release_created$/)
	if (!name || !value) continue
	$`npm publish -w ${name[0].replace(/--release_created$/, '')}`
}
