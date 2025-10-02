import type { DeleteResponse } from '@/lib/api/types-api';
import { del, select } from '@/lib/sql';
import { api } from '@/lib/api';
import useDB from '@/src/composables/useDB';

const db = useDB();

export default async function removeOne(id: string): Promise<DeleteResponse> {
	const sqlBuddy = select('persona', ['*'], { id });
	const buddy = await db.get(sqlBuddy[0], sqlBuddy[1]);
	if (!buddy) {
		throw new Error('Buddy not found');
	}

	await api.thread.removeAll(buddy.id);
	await api.buddy.version.removeAll(buddy.id);

	const sql = del('persona', { id });
	await db.run(sql[0], sql[1]);
	return { success: true };
}
