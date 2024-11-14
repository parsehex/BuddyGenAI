import { AppSettings, AppSettingsDefaults } from '@/lib/api/AppSettings';

const settingsKeys = Object.keys(AppSettingsDefaults);

type Settings = Record<string, any>;

export default async function update(
	values: Record<string, any>
): Promise<Settings> {
	// TODO this isnt used either right?
	const keys = Object.keys(values);

	keys.forEach((key: any) => {
		AppSettings.set(key, values[key]);
	});

	await AppSettings.saveSettings();

	return values;
}
