#!/usr/bin/env node

import {$} from "zx"
import * as workspaces from "./workspaces.js"
import {readPackage} from "read-pkg"

/**
 *
 * @param {string} workspace path of the workspace
 * @param {string} name name of the npm script to check for
 * @returns {Promise<boolean>}
 */
async function hasScript(workspace, name) {
	return (
		typeof (await readPackage({cwd: workspace})).scripts?.[name] == "string"
	)
}

let normals = []

for (let workspace of await workspaces.paths()) {
	process.stdout.write(`\n\n${workspace}:\n`)

	if (await hasScript(workspace, "lint")) {
		await $`npm run -w ${workspace} lint`
	} else {
		await $`npm exec -w ${workspace} -- origami-build-tools verify`
	}

	if (await hasScript(workspace, "build")) {
		// await $`npm run -w ${workspace} build`
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
