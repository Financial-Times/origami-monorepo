#!/usr/bin/env node
import {$} from "zx"
import {readPackage} from "read-pkg"

let outputs = JSON.parse(process.argv[2])

let {REPO_DATA_KEY, REPO_DATA_SECRET} = process.env

for (let key in outputs) {
	let value = outputs[key]
	let match = key.match(/^(.*)\/(.*)--release_created$/)
	if (!match || !value) continue
	let dir = match[1]
	let pkg = match[2]
	await $`npm publish -w ${dir}/${pkg}`
	let pkgjson = await readPackage({cwd: `${dir}/${pkg}`})
	await $`curl -X POST \
        -H 'Content-Type: application/json' -H 'X-Api-Key: ${REPO_DATA_KEY}' -H 'X-Api-Secret: "${REPO_DATA_SECRET}"' \
        -d '{"packageName": "${pkg}", "version": "v${pkgjson.version}", "type":"npm"}' \
        https://origami-repo-data-monorepo.herokuapp.com/v1/queue`
}

export {}
