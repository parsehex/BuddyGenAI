import type { DeleteResponse } from '@/lib/api/types-api';
import { del, select } from '@/lib/sql';
import { api } from '@/lib/api';
import useElectron from '@/composables/useElectron';

const { dbGet, dbRun } = useElectron();

export default async function removeOne(id: string): Promise<DeleteResponse> {
	if (!dbGet || !dbRun) throw new Error('dbGet or dbRun is not defined');

	const sqlBuddy = select('persona', ['*'], { id });
	const buddy = await dbGet(sqlBuddy[0], sqlBuddy[1]);
	if (!buddy) {
		throw new Error('Buddy not found');
	}

	await api.thread.removeAll(buddy.id);
	await api.buddy.version.removeAll(buddy.id);

	const sql = del('persona', { id });
	await dbRun(sql[0], sql[1]);
	return { success: true };
}
