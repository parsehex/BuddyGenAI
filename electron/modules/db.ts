import Database, { Database as DB } from 'better-sqlite3';
import { BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import log from 'electron-log/main';
import { findDirectoryInPath, getDirname } from '../fs';
import { initAppSettings } from '../AppSettings';

const VERBOSE = false;

const isDev = process.env.NODE_ENV === 'development';

const dbLocations = {
	win32: '%APPDATA%/BuddyGenAI',
	linux: '~/.config/BuddyGenAI',
	darwin: '~/Library/Application Support/BuddyGenAI',
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

	// resolve ~ and %APPDATA%
	if (platform === 'win32') {
		const appData = process.env.APPDATA;
		if (appData) {
			dbPath = dbPath.replace('%APPDATA%', appData);
		}
	} else if (platform === 'linux') {
		dbPath = dbPath.replace('~', process.env.HOME as string);
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
		return path.resolve(__dirname, '../../migrations');
	}

	let parentDir = await findDirectoryInPath('resources', __dirname);
	if (!parentDir) {
		throw new Error('Could not find app resources directory');
	}
	return path.resolve(parentDir, 'migrations');
}

function fixParams(arr: any[]) {
	return arr.map((param) => {
		if (typeof param === 'boolean') {
			return param ? 1 : 0;
		}
		return param;
	});
}

let sqlDb: DB | null = null;
export function getDb() {
	if (!sqlDb) {
		throw new Error('Database not initialized');
	}
	return sqlDb;
}

export default async (mainWindow: BrowserWindow) => {
	log.log('[-] MODULE::db Initializing');
	const migrationsDir = await getMigrationsDir();

	log.log('dbPath', dbPath);

	let applyMigrations = false;
	const dbExists = await fs
		.access(dbPath)
		.then(() => true)
		.catch(() => false);
	if (!dbExists) {
		applyMigrations = true;
	}

	let migrations = await fs.readdir(migrationsDir);
	migrations = migrations.filter((file) => file.endsWith('.sql'));
	migrations.sort();
	// if (applyMigrations) console.log('will apply migrations', migrations);

	const verbose = isDev && VERBOSE ? console.log.bind(console) : undefined;

	sqlDb = new Database(dbPath, { verbose });

	// run migrations
	for (const migration of migrations) {
		if (!applyMigrations) {
			break;
		}
		const content = await fs.readFile(
			path.join(migrationsDir, migration),
			'utf-8'
		);
		sqlDb.exec(content);
	}

	// console.log('migrations applied');

	if (applyMigrations) {
		// TODO fix table name
		const stmt = sqlDb.prepare(
			'INSERT INTO app_settings (name, value) VALUES (?, ?)'
		);
		sqlDb.transaction(() => {
			stmt.run('fresh_db', 1);
		});
	} else {
		const stmt = sqlDb.prepare('SELECT value FROM app_settings WHERE name = ?');
		let result = stmt.get('fresh_db') as string | number;
		// console.log('fresh_db', result);
		result = +result;
		if (result === 1) {
			const stmt = sqlDb.prepare(
				'UPDATE app_settings SET value = 0 WHERE name = ?'
			);
			sqlDb.transaction(() => {
				stmt.run('fresh_db');
			});
		}
	}

	ipcMain.handle('db:run', async (_, query: string, params) => {
		try {
			if (!sqlDb) {
				throw new Error('Database not initialized');
			}
			params = fixParams(params);
			const stmt = sqlDb.prepare(query);
			const tx = sqlDb.transaction(() => {
				try {
					stmt.run(params);
				} catch (error) {
					log.error('dbRun query resulted in error:', query, params);
					log.error('dbRun error:', error);
				}
			});
			tx();
		} catch (error) {
			if (error) log.error('dbRun query resulted in error:', query, params);
			if (error) log.error('dbRun error:', error);
			return error;
		}
	});

	ipcMain.handle('db:get', async (_, query: string, params) => {
		try {
			if (!sqlDb) {
				throw new Error('Database not initialized');
			}
			params = fixParams(params);
			const stmt = sqlDb.prepare(query);
			const result = stmt.get(params);
			return result;
		} catch (error) {
			if (error) log.error('dbGet query resulted in error:', query, params);
			if (error) log.error('dbGet error:', error);
			return error;
		}
	});

	ipcMain.handle('db:all', async (_, query: string, params) => {
		try {
			if (!sqlDb) {
				throw new Error('Database not initialized');
			}
			params = fixParams(params);
			const stmt = sqlDb.prepare(query);
			const result = stmt.all(params);
			return result;
		} catch (error) {
			if (error) log.error('dbAll query resulted in error:', query, params);
			if (error) log.error('dbAll error:', error);
			return error;
		}
	});

	initAppSettings();

	log.log('[-] MODULE::db Initialized');
};
