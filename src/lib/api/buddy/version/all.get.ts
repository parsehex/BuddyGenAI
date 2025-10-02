import type { BuddyVersion } from '@/lib/api/types-db';
import { select } from '@/lib/sql';
import useDB from '@/src/composables/useDB';

const db = useDB();

export default async function getAll(id: string): Promise<BuddyVersion[]> {
	const sql = select('persona_version', ['*'], { persona_id: id });
	const versions = (await db.get(sql[0], sql[1])) as BuddyVersion[];
	return versions;
}
