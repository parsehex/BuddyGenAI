import type { BuddyVersionMerged } from '@/lib/api/types-db';
import { select } from '@/lib/sql';
import useDB from '@/src/composables/useDB';

const db = useDB();

export default async function getAll(): Promise<BuddyVersionMerged[]> {
	const sqlBuddies = select('persona', ['*']);
	const buddies = await db.all(sqlBuddies[0], sqlBuddies[1]);

	if (!buddies?.length) {
		return [];
	}

	const currentVersions = await Promise.all(
		buddies.map(async (buddy: BuddyVersionMerged) => {
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
			};
		})
	);

	currentVersions.sort((a, b) => b.updated - a.updated);

	return currentVersions;
}
