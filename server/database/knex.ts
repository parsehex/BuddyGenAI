import knex from 'knex';
import type { Knex } from 'knex';
import fs from 'fs/promises';
import path from 'path';
import { findDirectoryInPath, getDirname } from '~/lib/fs';

const RESET_DB_EVERY_RUN = false;

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
console.log('db path', dbPath);

// export const db = knex({
// 	client: 'sqlite3',
// 	connection: { filename },
// 	useNullAsDefault: true
// });

// export async function initDB() {
// 	const dir = app.getPath('userData');
// 	const filename = TEMP_DB ? ':memory:' : path.join(dir, 'db.sqlite');
// 	console.log('db path', filename);
// 	if (RESET_DB_EVERY_RUN && (await doesDBExist())) {
// 		console.log('db exists, resetting...');
// 		await fs.unlink(filename);
// 	}

// 	const db = knex({
// 		client: 'sqlite3',
// 		connection: { filename },
// 		useNullAsDefault: true
// 	});
// 	await db.migrate.latest();
// 	await db.destroy();
// }

async function getMigrationsDir() {
	const __dirname = await getDirname();

	let parentDir = await findDirectoryInPath('resources', __dirname);
	if (!parentDir) {
		throw new Error('Could not find app directory');
	}
	return path.resolve(parentDir, 'migrations');
}

// lets do another init func and return the db
let db: Knex | null = null;
export async function getDB() {
	if (!db) {
		db = knex({
			client: 'sqlite3',
			// connection: { filename },
			connection: { filename: dbPath },
			useNullAsDefault: true,
		});
		await db.migrate.latest({
			directory: await getMigrationsDir(),
		});
	}
	return db;
}
