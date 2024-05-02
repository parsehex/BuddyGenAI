import type { DeleteResponse } from '@/lib/api/types-api';
import { del, select } from '@/lib/sql';
import { api } from '@/lib/api';

const { dbGet, dbRun } = useElectron();

export default async function removeOne(id: string): Promise<DeleteResponse> {
	if (!dbGet || !dbRun) throw new Error('dbGet or dbRun is not defined');

	const sqlPersona = select('persona', ['*'], { id });
	const persona = await dbGet(sqlPersona[0], sqlPersona[1]);
	if (!persona) {
		throw new Error('Persona not found');
	}

	await api.thread.removeAll(persona.id);
	await api.buddy.version.removeAll(persona.id);

	const sql = del('persona', { id });
	await dbRun(sql[0], sql[1]);
	return { success: true };
}
