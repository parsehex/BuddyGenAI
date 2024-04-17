import { AppSettingsDefaults } from '~/server/AppSettings';

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async () => {
		return JSON.parse(JSON.stringify(AppSettingsDefaults));
	});
});
