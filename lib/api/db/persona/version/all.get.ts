import type { PersonaVersion } from '@/lib/api/types-db';
import { select } from '@/lib/sql';

const { dbGet } = useElectron();

export default async function getAll(id: string): Promise<PersonaVersion[]> {
	if (!dbGet) throw new Error('dbGet is not defined');

	const sql = select('persona_version', ['*'], { persona_id: id });
	const versions = (await dbGet(sql[0], sql[1])) as PersonaVersion[];
	return versions;
}
