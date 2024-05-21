import useElectron from '@/composables/useElectron';

const {
	listDirectory,
	pathJoin,
	pathResolve,
	dirname,
	fsAccess,
	fileURLToPath,
} = useElectron();

export async function getDirname() {
	if (!dirname) throw new Error('dirname not available');
	const __filename = await fileURLToPath(import.meta.url);
	const __dirname = dirname(__filename);
	return __dirname;
}

export async function findDirectoryInPath(dirName: string, startPath: string) {
	if (!listDirectory) throw new Error('listDirectory not available');
	let currentPath = startPath;
	let flag = false;
	while (!flag) {
		const files = await listDirectory(currentPath);
		if (files.includes(dirName)) {
			flag = true;
			return await pathResolve(currentPath, dirName);
		}
		currentPath = await pathResolve(currentPath, '..');
	}
	return null;
}

export async function findResourcesPath() {
	if (!pathResolve) throw new Error('pathResolve not available');

	// if we're in dev then find dir containing .nuxt
	if (process.env.NODE_ENV === 'development') {
		let dir = await getDirname();
		let p = await findDirectoryInPath('.nuxt', dir);
		if (p) return pathResolve(p, '..');
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
