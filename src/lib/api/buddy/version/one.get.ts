import type { BuddyVersion } from '@/lib/api/types-db';
import { select } from '@/lib/sql';
import useDB from '@/src/composables/useDB';

const db = useDB();

export default async function getOne(
	version_id: string
): Promise<BuddyVersion> {
	const sql = select('persona_version', ['*'], { id: version_id });
	const version = (await db.get(sql[0], sql[1])) as BuddyVersion;
	if (!version) {
		throw new Error('Version not found');
	}

	return version;
}
