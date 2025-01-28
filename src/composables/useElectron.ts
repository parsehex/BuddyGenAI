import { db } from '@/lib/db/schema';
import type { RunOperation, SelectOperation } from '../lib/sql';

export default function useElectron() {
	const copyToClipboard = (text: string) => {
		const input = document.createElement('input');
		input.setAttribute('value', text);
		document.body.appendChild(input);
		input.select();
		document.execCommand('copy');
		document.body.removeChild(input);
	};

	const toggleDevTools = () => {
		console.log('no-op: toggleDevTools');
	};

	const pickDirectory = async () => {
		console.log('no-op: pickDirectory');
	};

	const verifyModelDirectory = async () => {
		console.log('no-op: verifyModelDirectory');
		return '';
	};

	async function dbGet(query: SelectOperation, params: any[]) {
		const { type, table, conditions } = query;
		const dbTable = (db as any)[table];

		if (type === 'SELECT') {
			if (conditions && Object.keys(conditions).length > 0) {
				return await dbTable.where(conditions).first();
			}
			return await dbTable.toCollection().first();
		}

		throw new Error(`Unsupported operation for dbGet: ${type}`);
	}

	async function dbAll(query: SelectOperation, params: any[]) {
		const { type, table, conditions } = query;
		const dbTable = (db as any)[table];

		if (type === 'SELECT') {
			if (conditions && Object.keys(conditions).length > 0) {
				return await dbTable.where(conditions).toArray();
			}
			return await dbTable.toArray();
		}

		throw new Error(`Unsupported operation for dbAll: ${type}`);
	}

	async function dbRun(query: RunOperation, params: any[]) {
		const { type, table, conditions } = query;
		const dbTable = (db as any)[table];

		switch (type) {
			case 'INSERT':
				return await dbTable.add(query.data);

			case 'UPDATE':
				if (conditions && Object.keys(conditions).length > 0) {
					return await dbTable.where(conditions).modify(query.data);
				}
				throw new Error('Update requires conditions');

			case 'DELETE':
				if (conditions && Object.keys(conditions).length > 0) {
					return await dbTable.where(conditions).delete();
				}
				throw new Error('Delete requires conditions');

			default:
				throw new Error(`Unsupported operation: ${type}`);
		}
	}

	const pathJoin = async (path: string, ...paths: string[]): Promise<string> => {
		console.log('no-op: pathJoin', path, ...paths);
		return '';
	};
	const pathResolve = async (
		path: string,
		...paths: string[]
	): Promise<string> => {
		console.log('no-op: pathResolve', path, ...paths);
		return '';
	};
	const dirname = async (path: string): Promise<string> => {
		console.log('no-op: dirname', path);
		return '';
	};
	const basename = async (path: string): Promise<string> => {
		console.log('no-op: basename', path);
		return '';
	};
	const fsAccess = async (path: string): Promise<boolean> => {
		console.log('no-op: fsAccess', path);
		return false;
	};
	const fsUnlink = async (path: string): Promise<boolean> => {
		console.log('no-op: fsUnlink', path);
		return false;
	};
	const listDirectory = async (directory: string): Promise<string[]> => {
		console.log('no-op: listDirectory', directory);
		return [];
	};
	const mkdir = async (directory: string): Promise<boolean> => {
		console.log('no-op: mkdir', directory);
		return false;
	};
	const fileURLToPath = (url: string) => {
		console.log('no-op: fileURLToPath', url);
		return '';
	};

	const getDataPath = async (subPath?: string) => {
		console.log('no-op: getDataPath', subPath);
		return '';
	};

	const openExternalLink = async (url: string) => {
		window.open(url, '_blank', 'noopener,noreferrer');
	};

	const openModelsDirectory = async () => {
		console.log('no-op: openModelsDirectory');
	};

	const pickFile = async (fileType?: 'chat' | 'image' | 'tts' | 'stt') => {
		console.log('no-op: pickFile', fileType);
		return [];
	};
	const pickPackFile = async () => {
		console.log('no-op: pickPackFile');
		return [];
	};
	const importPack = async (source: string) => {
		console.log('no-op: importPack', source);
	};
	const moveFile = async (source: string, destination: string) => {
		console.log('no-op: moveFile', source, destination);
	};
	const linkFile = async (source: string, destination: string) => {
		console.log('no-op: linkFile', source, destination);
	};

	const closeApp = async () => {
		console.log('no-op: closeApp');
	};

	return {
		copyToClipboard,
		isElectron: false,
		toggleDevTools,
		pickDirectory,
		pickFile,
		pickPackFile,
		importPack,
		moveFile,
		linkFile,
		verifyModelDirectory,
		pathJoin,
		pathResolve,
		dirname,
		basename,
		listDirectory,
		mkdir,
		dbRun,
		dbGet,
		dbAll,
		fsAccess,
		fsUnlink,
		fileURLToPath,
		getDataPath,
		openExternalLink,
		openModelsDirectory,
		closeApp,
	};
}

function parseOperation(query: string) {
	try {
		// This assumes the second parameter of the returned array from sql functions
		// contains the operation object
		return JSON.parse(query);
	} catch {
		return null;
	}
}
