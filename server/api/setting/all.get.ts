import AppSettings from '~/server/AppSettings';

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		return AppSettings.getSettings();
	});
});
