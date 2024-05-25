// eslint-disable-next-line @typescript-eslint/no-var-requires
const builder = require('electron-builder');
const Platform = builder.Platform;
const fs = require('fs-extra');
const path = require('path');

const platform = 'WINDOWS';
// const platform = 'LINUX'
// const platform = 'MAC'

const versions = {
	llamaCpp: 'b2787',
	stabeDiffusionCpp: 'ce1bcc7',
};

const isVersionsSet = Object.values(versions).every((v) => v !== undefined);
if (!isVersionsSet) {
	console.error(
		'Please set the versions of the required binaries in the build.js file.'
	);
	process.exit(1);
}

/**
 * @type {import('electron-builder').CompressionLevel}
 */
const compression = 'maximum';
// set to 'maximum' for production builds

console.time(`build (${compression} compression-level)`);

// TODO check for the required binaries
// const binPath = path.join(__dirname, 'binaries/');

// const sdCPP = path.join(binPath, 'stable-diffusion.cpp', 'cuda12');
// const sdCPPbin =
// 	process.platform === 'win32'
// 		? path.join(sdCPP, 'sd.exe')
// 		: path.join(sdCPP, 'sd');

// if (!fs.existsSync(sdCPPbin)) {
// 	console.error(`Required binary not found: ${sdCPPbin}`);
// 	process.exit(1);
// }

// const sdVersionExists = fs.existsSync(
// 	path.join(
// 		binPath,
// 		'stable-diffusion.cpp',
// 		'version ' + versions.stabeDiffusionCpp
// 	)
// );

// copy version folders to binaries/build under their project names
// add file to folder called `version ${ver}`
// if (!sdVersionExists) {
// 	fs.copySync(
// 		sdCPP.replace('cuda12', ''),
// 		path.join(binPath, 'build', 'stable-diffusion.cpp')
// 	);
// 	const verPath = path.join(
// 		binPath,
// 		'stable-diffusion.cpp',
// 		'version ' + versions.stabeDiffusionCpp
// 	);
// 	fs.writeFileSync(verPath, '');
// }

// copy binaries to the output folder
// const outputBinPath = path.join(__dirname, '.output', 'binaries');
// fs.copySync(binPath, outputBinPath);

/**
 * @type {import('electron-builder').Configuration}
 */
const options = {
	appId: 'com.buddygenai',
	productName: 'BuddyGenAI',

	// "store" | "normal" | "maximum" - For testing builds, use 'store' to reduce build time significantly.
	compression,
	removePackageScripts: true,

	nodeGypRebuild: false,
	buildDependenciesFromSource: false,

	directories: {
		output: 'electron-dist',

		app: '.output',
	},
	extraResources: ['./binaries/**/*', './licenses/**/*', './migrations/**/*'],

	win: {
		// eslint-disable-next-line no-template-curly-in-string
		artifactName: '${productName}-Setup-${version}.${ext}',
		icon: './build/icon.ico',
		target: [
			{
				target: 'nsis',
				arch: ['x64'],
				// arch: ['x64', 'ia32']
			},
		],
	},
	nsis: {
		deleteAppDataOnUninstall: true,
	},
	mac: {
		category: 'public.app-category.entertainment',
		hardenedRuntime: false,
		gatekeeperAssess: false,
		target: [
			{
				target: 'default',
				arch: ['x64', 'arm64'],
			},
		],
	},
	linux: {
		maintainer: 'Your Name',
		desktop: {
			StartupNotify: 'false',
			Encoding: 'UTF-8',
			MimeType: 'x-scheme-handler/deeplink',
		},
		target: ['dir'],
		// target: ['AppImage']
		// target: ['AppImage', 'rpm', 'deb']
	},
};

let source = './package.json';
let dest = './.output/package.json';
fs.copyFileSync(source, dest);

// TODO how can we install deps programmatically?
source = './node_modules';
dest = './.output/node_modules';
fs.copySync(source, dest);

builder
	.build({
		targets: Platform[platform].createTarget(),
		config: options,
	})
	.then((result) => {
		console.log('----------------------------');
		console.log('Platform:', platform);
		console.log('Output:', JSON.stringify(result, null, 2));
		console.timeEnd(`build (${compression} compression-level)`);
	});
