import type { DeleteResponse } from '@/types/api';
import { del, select } from '@/sql';
import { get, run } from '@/modules/db';

export async function removeBuddy(id: string): Promise<DeleteResponse> {
	const sqlBuddy = select('persona', ['*'], { id });
	const buddy = await get(sqlBuddy[0], sqlBuddy[1]);
	if (!buddy) {
		throw new Error('Buddy not found');
	}

	// await api.thread.removeAll(buddy.id);
	// await api.buddy.version.removeAll(buddy.id);

	// TODO
	// maybe this isnt needed? i thought we have cascade delete on db
	// await removeAllThreadsFunc(buddy.id);
	// await removeAllBuddyVersionsFunc(buddy.id);

	const sql = del('persona', { id });
	await run(sql[0], sql[1]);
	return { success: true };
}
