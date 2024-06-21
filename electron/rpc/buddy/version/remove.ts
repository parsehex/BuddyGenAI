import { del } from '@/sql';
import { DeleteResponse } from '@/types/api';
import { run } from '@/modules/db';

export async function removeAllBuddyVersions(
	id: string
): Promise<DeleteResponse> {
	const sql = del('persona_version', { persona_id: id });
	await run(sql[0], sql[1]);
	return { success: true };
}
