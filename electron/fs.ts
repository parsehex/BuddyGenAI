import fs from 'fs/promises';
import path from 'path';

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

type ProjectName = 'llama.cpp' | 'stable-diffusion.cpp' | 'whisper.cpp'; // bark.cpp?
type Binaries = {
	'llama.cpp': 'main' | 'server';
	'stable-diffusion.cpp': 'sd';
	'whisper.cpp': 'main' | 'server';
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
	let binPath = path.join(resPath, projectName, exe);
	// console.log('binPath', binPath, exe);

	// look for the binary in the following directories relative to the resources path:
	const directories = ['', 'build', 'build/bin/Release', 'build/bin'];

	for (let i = 0; i < directories.length; i++) {
		try {
			binPath = path.join(resPath, projectName, directories[i], exe);
			// console.log('checking', binPath);
			await fs.access(binPath);
			console.log('found', binPath);
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
	return p;
}
