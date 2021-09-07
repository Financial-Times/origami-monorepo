import {$} from "zx"
import {globby as glob} from "globby"
import {readPackage} from "read-pkg"
import toposort from "toposort"

let pkgJson = await readPackage()
let workspaces = Array.isArray(pkgJson.workspaces)
	? pkgJson.workspaces
	: pkgJson.workspaces.packages

export const paths = () => glob(workspaces, {onlyDirectories: true})

/**
 *
 * @param {string[]=} workspaces paths of workspaces to sort
 * @returns {Promise<string[]>} toposorted workspaces
 */
export async function sort(workspaces) {
	let allWorkspaces = await paths()
	if (!workspaces) workspaces = allWorkspaces
	let names = new Set()
	let namePathMap = {}
	let pathPackageMap = {}
	let edges = []

	for (let workspace of allWorkspaces) {
		let pkg = await readPackage({cwd: workspace})
		if (workspaces.includes(workspace)) {
			names.add(pkg.name)
		}
		namePathMap[pkg.name] = workspace
		pathPackageMap[workspace] = pkg
	}

	for (let path of workspaces) {
		let pkg = pathPackageMap[path]

		let deps = Object.keys(pkg.peerDependencies || {}).filter(dep => {
			return names.has(dep)
		})

		edges.push(...deps.map(dep => [dep, pkg.name]))
	}

	return toposort.array(Array.from(names), edges).map(n => {
		return namePathMap[n]
	})
}
