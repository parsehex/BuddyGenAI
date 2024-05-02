import { del } from '@/lib/sql';
import type { DeleteResponse } from '@/lib/api/types-api';

const { dbGet, dbRun } = useElectron();

export default async function removeAll(id: string): Promise<DeleteResponse> {
	if (!dbGet) throw new Error('dbGet is not defined');

	const sql = del('persona_version', { persona_id: id });
	await dbRun(sql[0], sql[1]);
	return { success: true };
}
