import { AppSettingsDefaults } from '@/lib/api/AppSettings';

export default async function getDefaults() {
	return JSON.parse(JSON.stringify(AppSettingsDefaults));
}
