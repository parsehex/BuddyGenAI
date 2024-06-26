import type { BuddyVersion } from '@/lib/api/types-db';
import { select } from '@/lib/sql';
import useElectron from '@/composables/useElectron';

const { dbGet } = useElectron();

export default async function getAll(id: string): Promise<BuddyVersion[]> {
	if (!dbGet) throw new Error('dbGet is not defined');

	const sql = select('persona_version', ['*'], { persona_id: id });
	const versions = (await dbGet(sql[0], sql[1])) as BuddyVersion[];
	return versions;
}
