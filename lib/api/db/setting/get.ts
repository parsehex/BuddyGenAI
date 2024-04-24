import AppSettings, { AppSettingsDefaults } from '../../AppSettings';

const settingsKeys = Object.keys(AppSettingsDefaults);

type Settings = Record<string, any>;

export default async function get(keys: string[]): Promise<Settings> {
	return AppSettings.getSettings(keys as any);
}
