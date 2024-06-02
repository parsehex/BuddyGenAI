import { AppSettings } from '@/lib/api/AppSettings';

export default async function getAll() {
	return AppSettings.getSettings();
}
