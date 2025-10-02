import type { BuddyVersion } from '@/lib/api/types-db';
import { select } from '@/lib/sql';
import useDB from '@/src/composables/useDB';

const db = useDB();

export default async function getCurrent(id: string): Promise<BuddyVersion> {
	const sql = select('persona_version', ['*'], { id });
	const currentVersion = (await db.get(sql[0], sql[1])) as BuddyVersion;
	if (!currentVersion) {
		throw new Error('Current version not found');
	}

	return currentVersion;
}
