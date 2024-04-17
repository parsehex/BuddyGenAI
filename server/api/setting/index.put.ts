import AppSettings, { AppSettingsDefaults } from '~/server/AppSettings';

const settingsKeys = Object.keys(AppSettingsDefaults);

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		const values = await readBody(event);

		if (!values) {
			throw createError({ statusCode: 400, statusMessage: 'No values provided' });
		}

		// validate that all keys are in the settingsKeys array
		const keys = Object.keys(values);
		const unkownKeys = keys.filter((key) => !settingsKeys.includes(key));
		if (unkownKeys.length) {
			throw createError({ statusCode: 400, statusMessage: `Setting key(s) not found: ${unkownKeys.join(', ')}` });
		}

		keys.forEach((key) => {
			// @ts-ignore
			AppSettings.set(key, values[key]);
		});
		await AppSettings.saveSettings();

		return values;
	});
});
