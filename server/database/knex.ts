// const dir = app.getPath('userData');
// const filename = TEMP_DB ? ':memory:' : path.join(dir, 'db.sqlite');
// console.log('db path', filename);
// if (RESET_DB_EVERY_RUN && (await doesDBExist())) {
// 	console.log('db exists, resetting...');
// 	await fs.unlink(filename);
// }

// const db = knex({
// 	client: 'sqlite3',
// 	connection: { filename },
// 	useNullAsDefault: true
// });

import knex from 'knex';
import type { Knex } from 'knex';
import fs from 'fs/promises';
import path from 'path';

const RESET_DB_EVERY_RUN = false;
// TODO
const dir = '/home/user/.config/Electron';
const filename = 'db.sqlite';

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

// lets do another init func and return the db
let db: Knex | null = null;
export async function getDB() {
	if (!db) {
		db = knex({
			client: 'sqlite3',
			connection: { filename },
			// connection: { filename: path.join(dir, filename) },
			useNullAsDefault: true,
		});
		await db.migrate.latest();
	}
	return db;
}
