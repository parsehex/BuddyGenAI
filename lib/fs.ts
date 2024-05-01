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
	if (!pathJoin) throw new Error('pathJoin not available');
	let exe = binaryName;
	// @ts-ignore
	if (process.platform === 'win32') exe += '.exe';

	let resPath = await findResourcesPath();
	let binPath = await pathJoin(resPath, projectName, exe);
	// console.log('binPath', binPath, exe);

	// look for the binary in the following directories relative to the resources path:
	const directories = ['', 'build', 'build/Release', 'build/bin'];

	for (let i = 0; i < directories.length; i++) {
		try {
			binPath = await pathJoin(resPath, projectName, directories[i], exe);
			// console.log('checking', binPath);
			const result = await fsAccess(binPath);
			if (!result) continue;
			return binPath;
		} catch (error) {}
	}
	try {
		const result = await fsAccess(binPath);
		if (!result) throw new Error('Binary not found');
		return binPath;
	} catch (error) {
		throw new Error(`Binary ${exe} not found for project ${projectName}`);
	}
}
