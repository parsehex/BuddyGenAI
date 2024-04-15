import type { Knex } from 'knex';
import { getDB } from './database/knex';

export const AppSettingsDefaults: Record<string, string> = {
	user_name: 'User',
	local_model_directory: '', // should have chat/ and image/ subdirectories
	selected_provider_chat: 'local',
	selected_provider_image: 'local', // not implemented
	selected_model_chat: '', // depends on selected_chat_api_provider
	selected_model_image: '',
};

// TODO AppSettings method to validate
const validations = {
	selected_provider_chat: ['external', 'local', 'custom'],
	selected_provider_image: ['local'], // ['external', 'local', 'custom'],
};

class AppSettings {
	public isLoaded = false;

	constructor() {
		this.loadSettings();
	}

	private db: Knex | null = null;
	private settings: Record<string, string> = JSON.parse(JSON.stringify(AppSettingsDefaults));

	private async getDB(): Promise<Knex> {
		if (!this.db) this.db = await getDB();
		return this.db;
	}

	public get(key: string): string {
		return this.settings[key];
	}
	public set(key: string, value: string): void {
		this.settings[key] = value;
	}

	public getSettings(keys?: string[]): Record<string, string> {
		if (!keys?.length) return this.settings;
		return keys.reduce((acc, key) => {
			// @ts-ignore
			acc[key] = this.settings[key];
			return acc;
		}, {});
	}

	private async loadSettings(): Promise<void> {
		const db = await this.getDB();
		const settings = await db('app_settings').select();
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
		const db = await this.getDB();
		const settings = Object.entries(this.settings).map(([name, value]) => ({ name, value }));

		const existingSettings = await db('app_settings').select();
		const existingSettingNames = existingSettings.map((setting: any) => setting.name);
		const newSettings = settings.filter((setting) => !existingSettingNames.includes(setting.name));
		const updatedSettings = settings
			.filter((setting) => existingSettingNames.includes(setting.name))
			.filter((setting) => {
				const existingSetting = existingSettings.find((s: any) => s.name === setting.name);
				return existingSetting?.value !== setting.value;
			});

		if (newSettings.length) {
			await db('app_settings').insert(newSettings);
		}
		if (updatedSettings.length) {
			await Promise.all(updatedSettings.map((setting) => db('app_settings').where('name', setting.name).update(setting)));
		}
	}
}

export default new AppSettings();
