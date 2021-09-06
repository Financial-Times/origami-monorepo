#!/usr/bin/env node

import {$} from "zx"
import * as workspaces from "./workspaces.mjs"
import {readPackage} from "read-pkg"

let sleep = async seconds => new Promise(wakeup => setTimeout(wakeup, seconds * 1000))

async function hasScript(workspace, name) {
	return typeof (await readPackage({cwd: workspace})).scripts?.[name] == "string"
}

let normals = []

for (let workspace of workspaces.paths()) {
	process.stdout.write(`\n\n${workspace}:\n`)
	
	if (await hasScript(workspace, "lint")) {
		await $`npm run -w ${workspace} lint`
	} else {
		await $`npm exec -w ${workspace} -- origami-build-tools verify` 
	}

	if (await hasScript(workspace, "test")) {
		await $`npm run -w ${workspace} test`
	} else {
		// get everything built up front
		await $`npm exec -w ${workspace} -- origami-build-tools demo`
		normals.push(workspace)
	}
}

// do karma setup here


export {}
