import knex from 'knex';
import type { Knex } from 'knex';
import path from 'path';
import fs from 'fs/promises';
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
	dbPath = path.join('data', 'db.sqlite');
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

export function getDataPath() {
	// TODO break out
	return dbPath.replace('db.sqlite', '');
}

async function getMigrationsDir() {
	const __dirname = await getDirname();

	if (isDev) {
		return path.resolve(__dirname, '../../server/database/migrations');
	}

	let parentDir = await findDirectoryInPath('resources', __dirname);
	if (!parentDir) {
		throw new Error('Could not find app resources directory');
	}
	return path.resolve(parentDir, 'server/database/migrations');
}

let db: Knex | null = null;
export async function getDB() {
	if (isDev) await fs.mkdir('data', { recursive: true });
	if (!db) {
		const migrationsDir = await getMigrationsDir();
		console.log('creating db', dbPath, 'migrations dir', migrationsDir);
		db = knex({
			client: 'sqlite3',
			connection: { filename: dbPath },
			migrations: {
				directory: migrationsDir,
			},
			useNullAsDefault: true,
		});
		await db.migrate.latest();
	}
	return db;
}
