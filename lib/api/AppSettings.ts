import { insert, select, update } from '@/lib/sql';
import type { SQLiteVal } from './types-db';

const { dbGet, dbAll, dbRun } = useElectron();

type AppSettingsKeys =
	| 'user_name'
	| 'local_model_directory'
	| 'selected_provider_chat'
	| 'selected_provider_image'
	| 'selected_model_chat'
	| 'selected_model_image'
	| 'fresh_db'
	| 'n_gpu_layers';

export const AppSettingsDefaults: Record<string, SQLiteVal> = {
	user_name: 'User',
	local_model_directory: '', // should have chat/ and image/ subdirectories
	selected_provider_chat: 'external',
	selected_provider_image: 'external', // not implemented
	selected_model_chat: '', // depends on selected_chat_api_provider
	selected_model_image: '',
	fresh_db: 0,
	n_gpu_layers: 0,
	// preferred_pic_quality (1 | 2 | 3)
	// used_binary_type_llamacpp (avx2 | clblast | cuda12 | arm64 | etc.)
	// used_binary_type_sd (avx2 | clblast | cuda12 | arm64 | etc.)
	//   ^^ base these options on what is available at runtime
};

// TODO AppSettings method to validate
const validations = {
	selected_provider_chat: ['external', 'local', 'custom'],
	selected_provider_image: ['local'], // ['external', 'local', 'custom'],
};

class AppSettingsCls {
	public isLoaded = false;

	constructor() {
		this.loadSettings();
	}

	private settings: Record<string, SQLiteVal> = JSON.parse(
		JSON.stringify(AppSettingsDefaults)
	);

	public get(key: AppSettingsKeys): SQLiteVal {
		return this.settings[key];
	}
	public set(key: AppSettingsKeys, value: string): void {
		// try to prevent resetting values
		// TODO do better
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

	private async loadSettings(): Promise<void> {
		if (!dbGet) throw new Error('dbGet not available');

		const sqlSettings = select('app_settings', ['*']);
		const settings = (await dbAll(sqlSettings[0], sqlSettings[1])) as {
			name: string;
			value: SQLiteVal;
		}[];

		if (!settings) {
			// idk if this is good
			await this.saveSettings();
			return;
		}

		let setDefaults = false;
		settings.forEach((setting) => {
			this.settings[setting.name] = setting.value;
		});

		// are there settings missing from AppSettingsDefaults?
		Object.keys(AppSettingsDefaults).forEach((key) => {
			if (!settings.find((setting) => setting.name === key)) {
				setDefaults = true;
				this.settings[key] = AppSettingsDefaults[key];
			}
		});
		if (setDefaults) {
			await this.saveSettings();
		}
		this.isLoaded = true;
	}

	// TODO do something better
	// expect consumers to call this after setting all
	public async saveSettings(): Promise<void> {
		if (!dbRun) throw new Error('dbRun not available');

		const settings = Object.entries(this.settings).map(([name, value]) => ({
			name,
			value,
		}));

		const sqlExistingSettings = select('app_settings', ['*']);
		const existingSettings = (await dbAll(
			sqlExistingSettings[0],
			sqlExistingSettings[1]
		)) as {
			name: string;
			value: SQLiteVal;
		}[];

		if (!existingSettings) {
			for (const setting of settings) {
				const sql = insert('app_settings', setting);
				await dbRun(sql[0], sql[1]);
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
				const existingSetting = existingSettings.find(
					(s: any) => s.name === setting.name
				);
				return existingSetting?.value !== setting.value;
			});

		if (newSettings.length) {
			for (const setting of newSettings) {
				const sql = insert('app_settings', setting);
				await dbRun(sql[0], sql[1]);
			}
		}
		if (updatedSettings.length) {
			for (const setting of updatedSettings) {
				const sql = update(
					'app_settings',
					{ value: setting.value },
					{ name: setting.name }
				);
				await dbRun(sql[0], sql[1]);
			}
		}
	}
}

export const AppSettings = new AppSettingsCls();
