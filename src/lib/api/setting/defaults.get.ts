import { AppSettingsDefaults } from '@/lib/api/AppSettings';

export default async function getDefaults() {
	// TODO this isnt used right?
	return JSON.parse(JSON.stringify(AppSettingsDefaults));
}
