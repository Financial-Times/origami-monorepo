#!/usr/bin/env node

import {$} from "zx"
import * as workspaces from "./workspaces.js"
import {readPackage} from "read-pkg"
import {readFile, writeFile} from "fs/promises"
import Mustache from "mustache"

let template = await readFile("templates/test-workflow.yml", "utf-8")

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

for (let workspace of await workspaces.paths()) {
	let view = {
		lint: "",
		test: "",
		workspace,
	}

	if (await hasScript(workspace, "lint")) {
		view.lint = `npm run -w ${workspace} lint`
	} else {
		view.lint = `npm exec -w ${workspace} -- origami-build-tools verify`
	}

	if (await hasScript(workspace, "build")) {
		// view.build = `npm run -w ${workspace} build`
	}

	if (await hasScript(workspace, "test")) {
		view.test = `npm run -w ${workspace} test`
	} else {
		view.test = `npm exec -w ${workspace} -- origami-build-tools test`
	}

	let file = Mustache.render(template, view)

	await writeFile(
		`.github/workflows/test-${workspace.replace(/\//g, "-")}.yml`,
		file
	)
}

export {}
