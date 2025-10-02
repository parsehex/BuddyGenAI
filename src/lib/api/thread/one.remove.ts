import type { DeleteResponse } from '@/lib/api/types-api';
import { del, select } from '@/lib/sql';
import { api } from '@/lib/api';
import useDB from '@/src/composables/useDB';

const db = useDB();

export default async function removeOne(id: string): Promise<DeleteResponse> {
	const sqlThread = select('chat_thread', ['*'], { id });
	const thread = await db.get(sqlThread[0], sqlThread[1]);
	if (!thread) {
		throw new Error('Thread not found');
	}

	await api.message.removeAll(id);

	const sql = del('chat_thread', { id });
	await db.run(sql[0], sql[1]);
	return { success: true };
}
