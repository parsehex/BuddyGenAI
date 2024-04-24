import type { DeleteResponse } from '@/lib/api/types-api';
import { del, select } from '@/lib/sql';

const { dbGet, dbRun } = useElectron();

export default async function removeOne(id: string): Promise<DeleteResponse> {
	if (!dbGet || !dbRun) throw new Error('dbGet or dbRun is not defined');

	const sqlPersona = select('persona', ['*'], { id });
	const persona = await dbGet(sqlPersona[0], sqlPersona[1]);
	if (!persona) {
		throw new Error('Persona not found');
	}

	const sql = del('persona', { id });
	await dbRun(sql[0], sql[1]);

	const sqlVersions = del('persona_version', { persona_id: id });
	await dbRun(sqlVersions[0], sqlVersions[1]);
	return { success: true };
}
