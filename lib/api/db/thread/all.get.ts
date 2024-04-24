import type { ChatThread } from '@/lib/api/types-db';
import { select } from '@/lib/sql';

const { dbAll } = useElectron();

export default async function getAll(
	persona_id?: string
): Promise<ChatThread[]> {
	if (!dbAll) throw new Error('dbAll is not defined');

	if (persona_id) {
		const sql = select('chat_thread', ['*'], { persona_id });
		return (await dbAll(sql[0], sql[1])) as ChatThread[];
	} else {
		const sql = select('chat_thread', ['*']);
		return (await dbAll(sql[0], sql[1])) as ChatThread[];
	}
}
