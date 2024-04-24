import AppSettings from '../../AppSettings';

export default async function getAll() {
	return AppSettings.getSettings();
}
