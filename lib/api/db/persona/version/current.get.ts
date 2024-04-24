import type { PersonaVersion } from '@/lib/api/types-db';
import { select } from '@/lib/sql';

const { dbGet } = useElectron();

export default async function getCurrent(id: string): Promise<PersonaVersion> {
	if (!dbGet) throw new Error('dbGet is not defined');

	const sql = select('persona_version', ['*'], { id });
	const currentVersion = (await dbGet(sql[0], sql[1])) as PersonaVersion;
	if (!currentVersion) {
		throw new Error('Current version not found');
	}

	return currentVersion;
}
