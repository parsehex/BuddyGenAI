import { del } from '@/lib/sql';
import type { DeleteResponse } from '@/lib/api/types-api';
import useDB from '@/src/composables/useDB';

const db = useDB();

export default async function removeAll(id: string): Promise<DeleteResponse> {
	const sql = del('persona_version', { persona_id: id });
	await db.run(sql[0], sql[1]);
	return { success: true };
}
