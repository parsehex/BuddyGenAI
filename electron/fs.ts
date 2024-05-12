import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';

export async function getDirname() {
	return __dirname;
}

export async function findDirectoryInPath(dirName: string, startPath: string) {
	let currentPath = startPath;
	let flag = false;
	while (!flag) {
		const files = await fs.readdir(currentPath);
		if (files.includes(dirName)) {
			flag = true;
			return path.resolve(currentPath, dirName);
		}
		currentPath = path.resolve(currentPath, '..');
	}
	return null;
}

export async function findResourcesPath() {
	// if we're in dev then find dir containing .nuxt
	if (process.env.NODE_ENV === 'development') {
		let dir = await getDirname();
		let p = await findDirectoryInPath('.nuxt', dir);
		if (p) return path.resolve(p, '..');
	}

	const dir = await getDirname();
	let p = await findDirectoryInPath('resources', dir);
	if (!p) {
		p = await findDirectoryInPath('.output', dir);
	}
	if (!p) {
		throw new Error('Could not find the resources directory');
	}
	return p;
}

const llamaGoodError = 'failed to load model';
const sdGoodError = 'the following arguments are required';

function tryBinary(p: string) {
	return new Promise((resolve, reject) => {
		execFile(p, (error, stdout, stderr) => {
			if (
				error &&
				!error.message.includes(llamaGoodError) &&
				!error.message.includes(sdGoodError)
			) {
				console.log('execFile', error);
				reject(error);
			} else {
				resolve(stdout);
			}
		});
	});
}

type ProjectName =
	| 'llama.cpp'
	| 'stable-diffusion.cpp'
	| 'whisper.cpp'
	| 'llamafile'; // bark.cpp?
type Binaries = {
	'llama.cpp': 'main' | 'server';
	'stable-diffusion.cpp': 'sd';
	'whisper.cpp': 'main' | 'server';
	llamafile: 'llamafile-0.8.1';
};
type BinaryName<T extends ProjectName> = Binaries[T];
export async function findBinaryPath<T extends ProjectName>(
	projectName: T,
	binaryName: BinaryName<T>
) {
	let exe = binaryName;
	// @ts-ignore
	if (process.platform === 'win32') exe += '.exe';

	let resPath = await findResourcesPath();

	if (projectName === 'llamafile') {
		let binPath = path.join(resPath, 'binaries/', exe);
		await fs.access(binPath);
		return binPath;
	}

	let binPath = path.join(resPath, 'binaries/build', projectName, exe);

	// TODO pull these in dynamically at runtime + have preferred order like below (out of available)
	const directories = [
		'cuda12',
		'cuda11',
		'rocm5.5',
		'clblast',
		'vulkan',
		'avx512',
		'avx2',
		'avx',
		'noavx',
	];

	for (let i = 0; i < directories.length; i++) {
		try {
			binPath = path.join(
				resPath,
				'binaries/build',
				projectName,
				directories[i],
				exe
			);
			// console.log('checking', binPath);
			await fs.access(binPath);
			// console.log('found', binPath);
			await tryBinary(binPath);
			console.log('using', directories[i], 'version of', projectName);
			return binPath;
		} catch (error) {}
	}
	try {
		await fs.access(binPath);
		return binPath;
	} catch (error) {
		throw new Error(`Binary ${exe} not found for project ${projectName}`);
	}
}
export function getDataPath(subPath?: string) {
	const dbLocations = {
		win32: '%APPDATA%/BuddyGenAI',
		linux: '~/.config/BuddyGenAI',
		darwin: '~/Library/Application Support/BuddyGenAI',
	};

	const platform = process.platform;
	// @ts-ignore
	const dir = dbLocations[platform];
	let p = '';
	if (process.env.NODE_ENV === 'development') {
		p = path.join('data', subPath || '');
	} else {
		p = path.join(dir, subPath || '');

		// resolve ~ and %APPDATA%
		if (platform === 'win32') {
			const appData = process.env.APPDATA;
			if (appData) {
				p = p.replace('%APPDATA%', appData);
			}
		} else if (platform === 'linux') {
			p = p.replace('~', process.env.HOME as string);
		} else if (platform === 'darwin') {
			p = p.replace('~', '/Users/' + process.env.USER);
		}
	}
	p = path.resolve(p);
	return p;
}
