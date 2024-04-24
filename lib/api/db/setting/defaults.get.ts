import { AppSettingsDefaults } from '../../AppSettings';

export default async function getDefaults() {
	return JSON.parse(JSON.stringify(AppSettingsDefaults));
}
