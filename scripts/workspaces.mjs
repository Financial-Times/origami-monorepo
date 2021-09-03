import {$} from "zx"
import {globbyStream as glob} from "globby"
import {readPackage} from "read-pkg"

let pkgJson = await readPackage()

export const paths = () => glob(pkgJson.workspaces, {onlyDirectories: true})

export const packages = async function (workspaces = paths()) {
	let packages = []
	for await (let cwd of workspaces) {
		packages.push(await readPackage({cwd}))
	}
	return packages
}
