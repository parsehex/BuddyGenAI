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
	| 'selected_model_tts'
	| 'selected_model_whisper'
	| 'gpu_enabled_chat'
	| 'gpu_enabled_image'
	| 'gpu_enabled_whisper'
	| 'chat_image_enabled'
	| 'chat_image_quality'
	| 'external_api_key'
	| 'fresh_db'
	| 'n_gpu_layers'
	| 'auto_send_stt'
	| 'auto_read_chat'
	| 'auto_start_server'
	| 'skip_start_dialog';

export const AppSettingsDefaults: Record<string, SQLiteVal> = {
	user_name: 'User',
	chat_image_enabled: 0,
	chat_image_quality: 'medium',
	fresh_db: 0,
	auto_send_stt: 0,
	auto_read_chat: 0,
	skip_start_dialog: 0,
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
			value: string;
		};
		if (!row) {
			throw new Error('Setting not found');
		}
		try {
			return JSON.parse(`"${row.value}"`);
		} catch (e) {
			return row.value;
		}
	}
}

export const AppSettings = new AppSettingsCls();

export function initAppSettings() {
	const db = getDb();
	if (!db) return;
	AppSettings.setDatabase(db);
}
