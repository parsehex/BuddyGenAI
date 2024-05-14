import { Database } from 'better-sqlite3';
import { getDb } from './modules/db';
type SQLiteVal = string | number | null;

type AppSettingsKeys =
	| 'user_name'
	| 'local_model_directory'
	| 'selected_provider_chat'
	| 'selected_provider_image'
	| 'selected_model_chat'
	| 'selected_model_image'
	| 'external_api_key'
	| 'fresh_db'
	| 'n_gpu_layers'
	| 'auto_start_server';

export const AppSettingsDefaults: Record<string, SQLiteVal> = {
	user_name: 'User',
	local_model_directory: '',
	selected_provider_chat: 'external',
	selected_provider_image: 'external',
	selected_model_chat: '',
	selected_model_image: '',
	external_api_key: '',
	fresh_db: 0,
	n_gpu_layers: 0,
	auto_start_server: 0,
};

class AppSettingsCls {
	public isLoaded = false;
	private db?: Database;

	setDatabase(db: Database) {
		this.db = db;
	}

	public async get(key: AppSettingsKeys): Promise<SQLiteVal> {
		if (!this.db) {
			throw new Error('Database not set');
		}
		const row = this.db
			.prepare('SELECT value FROM app_settings WHERE name = ?')
			.get(key) as {
			value: SQLiteVal;
		};
		if (!row) {
			throw new Error('Setting not found');
		}
		return row.value;
	}
	public async set(key: AppSettingsKeys, value: string): Promise<void> {
		if (!this.db) {
			throw new Error('Database not set');
		}
		this.db
			.prepare('INSERT OR REPLACE INTO app_settings (name, value) VALUES (?, ?)')
			.run(key, value);
	}
}

export const AppSettings = new AppSettingsCls();

export function initAppSettings() {
	const db = getDb();
	if (!db) return;
	AppSettings.setDatabase(db);
}
