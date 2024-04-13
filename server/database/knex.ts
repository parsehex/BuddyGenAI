import knex from 'knex';
import type { Knex } from 'knex';
import path from 'path';
import { findDirectoryInPath, getDirname } from '~/lib/fs';

const isDev = process.env.NODE_ENV === 'development';

const dbLocations = {
	// TODO app name
	win32: '%APPDATA%/Electron',
	linux: '~/.config/Electron',
	darwin: '~/Library/Application Support/Electron',
};

const platform = process.platform;
// @ts-ignore
const dir = dbLocations[platform];
const filename = 'db.sqlite';
let dbPath = '';
if (isDev) {
	dbPath = filename;
} else {
	dbPath = path.join(dir, filename);
	if (platform === 'win32') {
		const appData = process.env.APPDATA;
		if (appData) {
			dbPath = dbPath.replace('%APPDATA%', appData);
		}
	} else if (platform === 'linux') {
		dbPath = dbPath.replace('~', process.env.HOME as string);
		console.log('l');
	} else if (platform === 'darwin') {
		dbPath = dbPath.replace('~', '/Users/' + process.env.USER);
	}
}

async function getMigrationsDir() {
	const __dirname = await getDirname();

	if (isDev) {
		return path.resolve(__dirname, '../../migrations');
	}

	let parentDir = await findDirectoryInPath('resources', __dirname);
	if (!parentDir) {
		throw new Error('Could not find app directory');
	}
	return path.resolve(parentDir, 'migrations');
}

let db: Knex | null = null;
export async function getDB() {
	if (!db) {
		db = knex({
			client: 'sqlite3',
			connection: { filename: dbPath },
			useNullAsDefault: true,
		});
		await db.migrate.latest({
			directory: await getMigrationsDir(),
		});
	}
	return db;
}
