import type { BuddyVersion } from '@/lib/api/types-db';
import { select } from '@/lib/sql';

const { dbGet } = useElectron();

export default async function getOne(
	version_id: string
): Promise<BuddyVersion> {
	if (!dbGet) throw new Error('dbGet is not defined');

	const sql = select('persona_version', ['*'], { id: version_id });
	const version = (await dbGet(sql[0], sql[1])) as BuddyVersion;
	if (!version) {
		throw new Error('Version not found');
	}

	return version;
}
