import { insert, select, update } from '@/lib/sql';
import useElectron from '@/composables/useElectron';
import type { DBVal, SQLiteVal } from './types-db';
import { delay } from '../utils';

type FeatureType = 'chat' | 'image' | 'tts' | 'stt';

interface FeatureRequirements {
	requiredSettings: AppSettingsKeys[];
	validateFn?: (settings: Settings) => boolean;
}

const { dbGet, dbAll, dbRun } = useElectron();

type AppSettingsKeys = keyof Settings;

export const AppSettingsDefaults: Settings = {
	user_name: 'User',
	user_image: '',
	user_description: '',
	user_description_assistant: true,
	user_description_buddies: true,
	openrouter_api_key: '',
	koboldcpp_host: '',
	local_model_directory: '',
	selected_provider_chat: '',
	selected_provider_image: '',
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
};

type Provider = 'cloud' | 'local' | '';
export interface Settings {
	user_name: string;
	user_image: string;
	user_description: string;
	user_description_assistant: boolean;
	user_description_buddies: boolean;
	openrouter_api_key: string;
	koboldcpp_host: string;
	local_model_directory: string;
	selected_provider_chat: Provider;
	selected_provider_image: Provider;
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

	private featureRequirements: Record<FeatureType, FeatureRequirements> = {
		chat: {
			requiredSettings: ['selected_model_chat', 'selected_provider_chat'],
			validateFn: (settings) => {
				if (settings.selected_provider_chat === 'local') {
					return !!settings.koboldcpp_host;
				}
				return !!settings.openrouter_api_key;
			},
		},
		image: {
			requiredSettings: ['selected_model_image', 'selected_provider_image'],
			validateFn: (settings) => {
				if (settings.selected_provider_image === 'local') {
					return !!settings.koboldcpp_host;
				}
				return false;
			},
		},
		tts: {
			requiredSettings: ['selected_model_tts'],
			validateFn: (settings) => settings.selected_model_tts !== '0',
		},
		stt: {
			requiredSettings: ['selected_model_whisper'],
			validateFn: (settings) => settings.selected_model_whisper !== '0',
		},
	};

	public isFeatureAvailable(feature: FeatureType): boolean {
		const requirements = this.featureRequirements[feature];
		if (!requirements) return false;

		// Check if all required settings have non-empty values
		const hasRequiredSettings = requirements.requiredSettings.every((key) => {
			const value = this.settings[key];
			return value !== undefined && value !== '' && value !== '0';
		});

		// If there's a custom validation function, use it
		if (requirements.validateFn) {
			return requirements.validateFn(this.settings);
		}

		return hasRequiredSettings;
	}

	public getAvailableFeatures(): FeatureType[] {
		return Object.keys(this.featureRequirements).filter((feature) =>
			this.isFeatureAvailable(feature as FeatureType)
		) as FeatureType[];
	}
}

export const AppSettings = new AppSettingsCls();
