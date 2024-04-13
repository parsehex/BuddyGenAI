import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

export async function getDirname() {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
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
