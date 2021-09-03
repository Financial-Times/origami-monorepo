#!/usr/bin/env node
import {$} from "zx"
import {readFile} from "fs/promises"

let outputs = JSON.parse(process.argv[2])

let {REPO_DATA_KEY, REPO_DATA_SECRET} = process.env

for (let key in outputs) {
	let value = outputs[key]
	let match = key.match(/^components\/(.*)--release_created$/)
	if (!match || !value) continue
	let pkg = match[0].replace(/--release_created$/, "")
	await $`npm publish -w ${pkg}`
	let pkgjson = JSON.parse(await readFile(`components/${pkg}`, "utf-8"))
	await $`curl -X POST \
        -H 'Content-Type: application/json' -H 'X-Api-Key: ${REPO_DATA_KEY}' -H 'X-Api-Secret: "${REPO_DATA_SECRET}"' \
        -d '{"packageName": "${pkg}", "version": "v${pkgjson.version}", "type":"npm"}' \
        https://origami-repo-data-monorepo.herokuapp.com/v1/queue`
}

export {}
