import type { BuddyVersionMerged } from '@/lib/api/types-db';
import { select } from '@/lib/sql';
import useElectron from '@/composables/useElectron';

const { dbGet } = useElectron();

export default async function getOne(id: string): Promise<BuddyVersionMerged> {
	if (!dbGet) throw new Error('dbGet is not defined');

	const sqlBuddy = select('persona', ['*'], { id });
	const buddy = (await dbGet(sqlBuddy[0], sqlBuddy[1])) as BuddyVersionMerged;
	if (!buddy) {
		throw new Error('Buddy not found');
	}

	const sqlCurrentVersion = select('persona_version', ['*'], {
		id: buddy.current_version_id,
	});
	const currentVersion = (await dbGet(
		sqlCurrentVersion[0],
		sqlCurrentVersion[1]
	)) as BuddyVersionMerged;
	if (!currentVersion) {
		throw new Error('Current version of Buddy not found');
	}

	return {
		...buddy,
		name: currentVersion.name,
		description: currentVersion.description,
	} as BuddyVersionMerged;
}
