import type { BuddyVersionMerged } from '@/lib/api/types-db';
import { select } from '@/lib/sql';
import useElectron from '@/composables/useElectron';

const { dbGet, dbAll } = useElectron();

export default async function getAll(): Promise<BuddyVersionMerged[]> {
	if (!dbGet || !dbAll) throw new Error('dbGet or dbAll is not defined');

	const sqlBuddies = select('persona', ['*']);
	const buddies = await dbAll(sqlBuddies[0], sqlBuddies[1]);

	if (!buddies?.length) {
		return [];
	}

	const currentVersions = await Promise.all(
		buddies.map(async (buddy: BuddyVersionMerged) => {
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
			};
		})
	);

	currentVersions.sort((a, b) => b.updated - a.updated);

	return currentVersions;
}
