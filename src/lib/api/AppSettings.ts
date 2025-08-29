import { insert, select, update } from '@/lib/sql';
import useElectron from '@/composables/useElectron';
import type { DBVal, SQLiteVal } from './types-db';
import { delay } from '../utils';

const { dbGet, dbAll, dbRun } = useElectron();

export type AppSettingsKeys = keyof Settings;

export const AppSettingsDefaults: Settings = {
	user_name: 'User',
	user_image: '',
	user_description: '',
	user_description_assistant: true,
	user_description_buddies: true,
	openrouter_api_key: '',
	koboldcpp_host: '',
	local_model_directory: '',
	selected_provider_chat: '0',
	selected_provider_image: '0',
	selected_provider_tts: '0',
	selected_provider_stt: '0',
	selected_model_chat: '',
	selected_model_image: '',
	selected_model_tts: '',
	selected_model_whisper: '',
	gpu_enabled_chat: true,
	gpu_enabled_image: true,
	gpu_enabled_whisper: true,
	chat_streaming: true,
	chat_image_enabled: false,
	chat_image_quality: 'medium',
	external_api_key: '',
	fresh_db: false,
	n_gpu_layers: 99,
	auto_send_stt: false,
	auto_read_chat: false,
	auto_start_server: false,
	skip_start_dialog: false,
	skip_setup: false,
	games_tab: false,
};

export type AnyPossibleProvider = 'koboldcpp' | 'openrouter' | 'webllm' | '0';
export type LLMProvider = 'koboldcpp' | 'openrouter' | 'webllm' | '0';
export const LLMProviders: LLMProvider[] = [
	'koboldcpp',
	'openrouter',
	'webllm',
	'0',
];
export type ImgProvider = 'koboldcpp' | '0';
export const ImgProviders: ImgProvider[] = ['koboldcpp', '0'];
export type TTSProvider = 'koboldcpp' | '0';
export const TTSProviders: TTSProvider[] = ['koboldcpp', '0'];
export type STTProvider = 'koboldcpp' | '0';
export const STTProviders: STTProvider[] = ['koboldcpp', '0'];
export type ProviderType =
	| LLMProvider
	| ImgProvider
	| TTSProvider
	| STTProvider;

export interface Settings {
	user_name: string;
	user_image: string;
	user_description: string;
	user_description_assistant: boolean;
	user_description_buddies: boolean;
	openrouter_api_key: string;
	koboldcpp_host: string;
	local_model_directory: string;
	selected_provider_chat: LLMProvider;
	selected_provider_image: ImgProvider;
	selected_provider_tts: TTSProvider;
	selected_provider_stt: STTProvider;
	selected_model_chat: string;
	selected_model_image: string;
	selected_model_tts: string;
	selected_model_whisper: string;
	gpu_enabled_chat: boolean;
	gpu_enabled_image: boolean;
	gpu_enabled_whisper: boolean;
	chat_streaming: boolean;
	chat_image_enabled: boolean;
	chat_image_quality: string;
	external_api_key: string;
	fresh_db: boolean;
	n_gpu_layers: number;
	auto_send_stt: boolean;
	auto_read_chat: boolean;
	auto_start_server: boolean;
	skip_start_dialog: boolean;
	skip_setup: boolean;
	games_tab: boolean;
	[key: string]: DBVal;
}

class AppSettingsCls {
	public isLoaded = false;
	private settingsKeys: string[] = [];

	constructor() {
		this.loadSettings();
		this.settingsKeys = Object.keys(this.settings);
	}

	public async waitForLoaded() {
		if (this.isLoaded) return;
		while (!this.isLoaded) {
			await delay(15);
		}
	}

	private settings: Settings = JSON.parse(JSON.stringify(AppSettingsDefaults));

	public get(key: string): DBVal {
		if (!this.settingsKeys.includes(key))
			console.error('Did not find settings key', key);
		return this.settings[key];
	}
	public set(key: AppSettingsKeys, value: any): void {
		// try to prevent resetting values
		// TODO do better
		if (value === undefined && this.settings[key]) return;
		this.settings[key] = value;
	}

	public getSettings(keys?: AppSettingsKeys[]): Settings {
		if (!keys?.length) return this.settings;
		return keys.reduce((acc, key) => {
			acc[key] = this.settings[key];
			return acc;
		}, {} as Settings);
	}

	private async loadSettings(): Promise<void> {
		if (!dbGet) throw new Error('dbGet not available');

		const sqlSettings = select('app_settings', ['*']);
		const settings = (await dbAll(sqlSettings[0], sqlSettings[1])) as {
			name: string;
			value: string;
		}[];

		if (!settings) {
			// idk if this is good
			await this.saveSettings();
			return;
		}

		let setDefaults = false;
		settings.forEach((setting) => {
			try {
				this.settings[setting.name] = JSON.parse(setting.value);
			} catch (e) {
				this.settings[setting.name] = setting.value;
			}
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
	// note that the Main store watches store.settings and saves on change
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
