const core = require("@actions/core")
const exec = require("@actions/exec")
const io = require("@actions/io")
const fs = require("fs")
const {context} = require("@actions/github")

const cwd = process.env.WORKSPACE_DIRECTORY || "."

const isPullRequest = context.payload.pull_request

process.chdir(cwd)

void (async function () {
	try {
		const isDefaultBranch = context.ref.endsWith("/main")
		if (isDefaultBranch || isPullRequest) {
			if (isPullRequest) {
				core.exportVariable(
					"PERCY_PULL_REQUEST",
					String(context.payload.pull_request.number)
				)
				core.exportVariable("PERCY_BRANCH", context.ref)
			}

			const componentConfig = JSON.parse(
				fs.readFileSync("./origami.json", "utf-8")
			)
			const demosConfig = componentConfig.demos || []

			if (componentConfig.brands) {
				for (const brand of componentConfig.brands) {
					await generateDemosFor(brand, demosConfig)
				}
			} else {
				await generateDemosFor("master", demosConfig)
			}

			await generatePercySnapshots()
		}
	} catch (error) {
		core.setFailed(error.message)
	}
})()

async function generateDemosFor(brand, demosConfig) {
	let npxPath = await io.which("npx", true)
	let outputDir = `demos/percy/${brand}`
	const brandSupportedDemos = demosConfig.filter(
		d => !Array.isArray(d.brands) || d.brands.includes(brand)
	)
	const demoNames = brandSupportedDemos.map(d => d.name).join(",")
	await exec.exec(
		`"${npxPath}" obt demo --brand=${brand} --demo-filter="${demoNames}"`,
		[],
		{cwd}
	)
	if (fs.existsSync("demos/local")) {
		await io.mkdirP(outputDir)
		await io.mv("demos/local", outputDir)
	}
}

async function generatePercySnapshots() {
	let npxPath = await io.which("npx", true)
	let outputDir = "demos/percy/"
	await exec.exec(`"${npxPath}" percy snapshot ${outputDir}`, [], {
		cwd,
	})
}
