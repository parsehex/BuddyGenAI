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
	selected_provider_chat: 'local',
	selected_provider_image: 'local',
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
		this.loadSettings();
	}

	private settings: Record<string, SQLiteVal> = JSON.parse(
		JSON.stringify(AppSettingsDefaults)
	);

	public get(key: AppSettingsKeys): SQLiteVal {
		return this.settings[key];
	}
	public set(key: AppSettingsKeys, value: string): void {
		if (!value && this.settings[key]) return;
		this.settings[key] = value;
	}

	public getSettings(keys?: AppSettingsKeys[]): Record<string, SQLiteVal> {
		if (!keys?.length) return this.settings;
		return keys.reduce((acc, key) => {
			acc[key] = this.settings[key];
			return acc;
		}, {} as Record<string, SQLiteVal>);
	}

	private loadSettings(): void {
		if (!this.db) return;
		const sqlSettings = 'SELECT * FROM app_settings';
		const settings = this.db.prepare(sqlSettings).all();

		if (!settings) {
			// this.saveSettings();
			return;
		}

		// let setDefaults = false;
		settings.forEach((setting: any) => {
			this.settings[setting.name] = setting.value;
		});

		Object.keys(AppSettingsDefaults).forEach((key) => {
			if (!settings.find((setting: any) => setting.name === key)) {
				// setDefaults = true;
				this.settings[key] = AppSettingsDefaults[key];
			}
		});
		// if (setDefaults) {
		// 	this.saveSettings();
		// }
		this.isLoaded = true;
	}

	// we're not saving anything electron-side
	public saveSettings(): void {
		if (!this.db) return;
		const settings = Object.entries(this.settings).map(([name, value]) => ({
			name,
			value,
		}));

		const sqlExistingSettings = 'SELECT * FROM app_settings';
		const existingSettings = this.db.prepare(sqlExistingSettings).all();

		if (!existingSettings) {
			for (const setting of settings) {
				const sql = `INSERT INTO app_settings (name, value) VALUES (?, ?)`;
				this.db.prepare(sql).run(setting.name, setting.value);
			}
			return;
		}

		const existingSettingNames = existingSettings.map(
			(setting: any) => setting.name
		);
		const newSettings = settings.filter(
			(setting) => !existingSettingNames.includes(setting.name)
		);
		const updatedSettings = settings
			.filter((setting) => existingSettingNames.includes(setting.name))
			.filter((setting) => {
				const existingSetting: any = existingSettings.find(
					(s: any) => s.name === setting.name
				);
				return existingSetting?.value !== setting.value;
			});

		if (newSettings.length) {
			for (const setting of newSettings) {
				const sql = `INSERT INTO app_settings (name, value) VALUES (?, ?)`;
				this.db.prepare(sql).run(setting.name, setting.value);
			}
		}
		if (updatedSettings.length) {
			for (const setting of updatedSettings) {
				const sql = `UPDATE app_settings SET value = ? WHERE name = ?`;
				this.db.prepare(sql).run(setting.value, setting.name);
			}
		}
	}
}

export const AppSettings = new AppSettingsCls();

export function initAppSettings() {
	const db = getDb();
	if (!db) return;
	AppSettings.setDatabase(db);
}
