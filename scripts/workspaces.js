import {$} from "zx"
import {globby as glob} from "globby"
import {readPackage} from "read-pkg"

let pkgJson = await readPackage()
let workspaces = Array.isArray(pkgJson.workspaces)
	? pkgJson.workspaces
	: pkgJson.workspaces.packages

export const paths = () => glob(workspaces, {onlyDirectories: true})

export const packages = async function (workspaces = paths()) {
	let packages = []
	for (let cwd of await workspaces) {
		packages.push(await readPackage({cwd}))
	}
	return packages
}
