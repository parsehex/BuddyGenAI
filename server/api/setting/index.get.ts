import { z } from 'zod';
import AppSettings, { AppSettingsDefaults } from '~/server/AppSettings';

const settingsKeys = Object.keys(AppSettingsDefaults);

const querySchema = z.object({
	keys: z.string(),
});

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		const { keys } = await getValidatedQuery(event, (query) => querySchema.parse(query));

		const keysArr = keys.split(',');
		if (!keysArr.length) {
			throw createError({ statusCode: 400, statusMessage: 'No setting keys provided' });
		}

		const unkownKeys = keys.split(',').filter((key) => !settingsKeys.includes(key));
		if (unkownKeys.length) {
			throw createError({ statusCode: 400, statusMessage: `Setting key(s) not found: ${unkownKeys.join(', ')}` });
		}
		return AppSettings.getSettings(keysArr as any);
	});
});
