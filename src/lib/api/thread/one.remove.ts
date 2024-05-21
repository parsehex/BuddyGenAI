import type { DeleteResponse } from '@/lib/api/types-api';
import { del, select } from '@/lib/sql';
import { api } from '@/lib/api';
import useElectron from '@/composables/useElectron';

const { dbGet, dbRun } = useElectron();

export default async function removeOne(id: string): Promise<DeleteResponse> {
	if (!dbGet || !dbRun) throw new Error('dbGet or dbRun is not defined');

	const sqlThread = select('chat_thread', ['*'], { id });
	const thread = await dbGet(sqlThread[0], sqlThread[1]);
	if (!thread) {
		throw new Error('Thread not found');
	}

	await api.message.removeAll(id);

	const sql = del('chat_thread', { id });
	await dbRun(sql[0], sql[1]);
	return { success: true };
}
