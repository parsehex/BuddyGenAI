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
	// if we're in dev then find dir containing .vscode
	if (process.env.NODE_ENV === 'development') {
		let dir = await getDirname();
		let p = await findDirectoryInPath('.vscode', dir);
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
const whisperGoodError = 'no input';

function tryBinary(p: string) {
	return new Promise((resolve, reject) => {
		execFile(p, (error, stdout, stderr) => {
			if (
				error &&
				!error.message.includes(llamaGoodError) &&
				!error.message.includes(sdGoodError) &&
				!error.message.includes(whisperGoodError) &&
				error.code !== 3221226505 // good piper error
			) {
				reject(error);
			} else {
				resolve(stdout);
			}
		});
	});
}

interface BinaryPaths {
	gpu: string;
	noGpu: string;
}
const binaryCache: Record<string, BinaryPaths> = {
	'llama.cpp': { gpu: '', noGpu: '' },
	'stable-diffusion.cpp': { gpu: '', noGpu: '' },
	'whisper.cpp': { gpu: '', noGpu: '' },
	piper: { gpu: '', noGpu: '' }, // only one binary (noGpu)
};

const gpuTypes = ['cuda12', 'rocm5.5', 'clblast'];
type ProjectName =
	| 'llama.cpp'
	| 'stable-diffusion.cpp'
	| 'whisper.cpp'
	| 'piper'
	| 'llamafile'; // bark.cpp?
type Binaries = {
	'llama.cpp': 'main' | 'server';
	'stable-diffusion.cpp': 'sd';
	piper: 'piper';
	'whisper.cpp': 'main' | 'server';
	llamafile: 'llamafile';
};
type BinaryName<T extends ProjectName> = Binaries[T];
export async function findBinaryPath<T extends ProjectName>(
	projectName: T,
	binaryName: BinaryName<T>,
	gpu = true
) {
	let exe = binaryName;
	// @ts-ignore
	if (process.platform === 'win32') exe += '.exe';

	let resPath = await findResourcesPath();

	const cached = binaryCache[projectName];
	if (cached[gpu ? 'gpu' : 'noGpu']) {
		return cached[gpu ? 'gpu' : 'noGpu'];
	}

	if (projectName === 'llamafile' || projectName === 'piper') {
		let binPath = path.join(resPath, 'binaries/', exe);
		await fs.access(binPath);
		return binPath;
	}

	let binPath = path.join(resPath, 'binaries/');

	// NOTE as of now, this only affects using SDCPP since we're using llamafile instead of llama.cpp
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
		'.',
	];

	if (!gpu) {
		let index = directories.indexOf('cuda12');
		if (index > -1) directories.splice(index, 1);
		index = directories.indexOf('cuda11');
		if (index > -1) directories.splice(index, 1);
		index = directories.indexOf('rocm5.5');
		if (index > -1) directories.splice(index, 1);
		index = directories.indexOf('clblast');
		if (index > -1) directories.splice(index, 1);
		index = directories.indexOf('vulkan');
		if (index > -1) directories.splice(index, 1);
	}

	for (let i = 0; i < directories.length; i++) {
		try {
			const dir = directories[i];
			binPath = path.join(
				resPath,
				'binaries/',
				dir,
				projectName.replace('.', '') + '-' + exe
			);

			if (gpu && !gpuTypes.includes(dir)) {
				continue;
			}

			await fs.access(binPath);
			await tryBinary(binPath);
			console.info('using', directories[i], 'version of', projectName);
			binaryCache[projectName][gpu ? 'gpu' : 'noGpu'] = binPath;
			return binPath;
		} catch (error) {}
	}

	if (gpu) {
		throw new Error(`GPU-enabled binary ${exe} not found for ${projectName}`);
	}

	try {
		await fs.access(binPath);
		binaryCache[projectName][gpu ? 'gpu' : 'noGpu'] = binPath;
		return binPath;
	} catch (error) {
		throw new Error(`Binary ${exe} not found for ${projectName}`);
	}
}
export function getDataPath(subPath = '') {
	const dataLocations = {
		win32: '%APPDATA%/BuddyGenAI',
		linux: '~/.config/BuddyGenAI',
		darwin: '~/Library/Application Support/BuddyGenAI',
	};

	const platform = process.platform;

	const isWin = platform === 'win32';
	const isLinux = platform === 'linux';
	const isMac = platform === 'darwin';

	// @ts-ignore
	const dir = dataLocations[platform];
	let p = '';
	if (process.env.NODE_ENV === 'development') {
		if (isWin && subPath.toLowerCase().includes('models')) {
			return 'C:/Users/User/BuddyGen Models';
		}

		return path.resolve(path.join('data', subPath || ''));
	}

	p = path.join(dir, subPath || '');

	if (isWin) {
		const appData = process.env.APPDATA;
		if (appData) {
			p = p.replace('%APPDATA%', appData);
		}
	} else if (isLinux) {
		p = p.replace('~', process.env.HOME as string);
	} else if (isMac) {
		p = p.replace('~', '/Users/' + process.env.USER);
	}

	p = path.resolve(p);
	return p;
}
