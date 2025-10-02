import type { BuddyVersionMerged } from '@/lib/api/types-db';
import { select } from '@/lib/sql';
import useDB from '@/src/composables/useDB';

const db = useDB();

export default async function getOne(id: string): Promise<BuddyVersionMerged> {
	const sqlBuddy = select('persona', ['*'], { id });
	const buddy = (await db.get(sqlBuddy[0], sqlBuddy[1])) as BuddyVersionMerged;
	if (!buddy) {
		throw new Error('Buddy not found');
	}

	const sqlCurrentVersion = select('persona_version', ['*'], {
		id: buddy.current_version_id,
	});
	const currentVersion = (await db.get(
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
