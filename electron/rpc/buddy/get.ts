import type { Buddy, BuddyVersion, BuddyVersionMerged } from '@/types/db';
import { select } from '@/sql';
import { all, get } from '@/modules/db';

export async function getAllBuddies(): Promise<BuddyVersionMerged[]> {
	const sqlBuddies = select('persona', ['*']);
	const buddies = (await all(sqlBuddies[0], sqlBuddies[1])) as Buddy[];

	if (!buddies?.length) {
		return [];
	}

	const currentVersions = await Promise.all(
		buddies.map(async (buddy) => {
			const sqlCurrentVersion = select('persona_version', ['*'], {
				id: buddy.current_version_id,
			});
			const currentVersion = (await get(
				sqlCurrentVersion[0],
				sqlCurrentVersion[1]
			)) as BuddyVersion;
			if (!currentVersion) {
				throw new Error('Current version of Buddy not found');
			}
			return {
				...buddy,
				name: currentVersion.name,
				description: currentVersion.description,
			} as BuddyVersionMerged;
		})
	);

	// @ts-ignore
	currentVersions.sort((a, b) => b.updated - a.updated);

	return currentVersions;
}

export async function getBuddy(id: string): Promise<BuddyVersionMerged> {
	const sqlBuddy = select('persona', ['*'], { id });
	const buddy = (await get(sqlBuddy[0], sqlBuddy[1])) as Buddy;
	if (!buddy) {
		throw new Error('Buddy not found');
	}

	const sqlCurrentVersion = select('persona_version', ['*'], {
		id: buddy.current_version_id,
	});
	const currentVersion = (await get(
		sqlCurrentVersion[0],
		sqlCurrentVersion[1]
	)) as BuddyVersion;
	if (!currentVersion) {
		throw new Error('Current version of Buddy not found');
	}

	return {
		...buddy,
		name: currentVersion.name,
		description: currentVersion.description,
	} as BuddyVersionMerged;
}
