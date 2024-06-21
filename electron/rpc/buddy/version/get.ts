import { BuddyVersion } from '@/types/db';
import { get } from '@/modules/db';
import { select } from '@/sql';

export async function getAllBuddyVersions(
	buddyId: string
): Promise<BuddyVersion[]> {
	const sql = select('persona_version', ['*'], { persona_id: buddyId });
	const versions = (await get(sql[0], sql[1])) as BuddyVersion[];
	return versions;
}

export async function getBuddyVersion(
	version_id: string
): Promise<BuddyVersion> {
	const sql = select('persona_version', ['*'], { id: version_id });
	const version = (await get(sql[0], sql[1])) as BuddyVersion;
	if (!version) {
		throw new Error('Version not found');
	}

	return version;
}

export async function getCurrentBuddyVersion(
	buddyId: string
): Promise<BuddyVersion> {
	const sql = select('persona_version', ['*'], { persona_id: buddyId });
	const currentVersion = (await get(sql[0], sql[1])) as BuddyVersion;
	if (!currentVersion) {
		throw new Error('Current version not found');
	}

	return currentVersion;
}
