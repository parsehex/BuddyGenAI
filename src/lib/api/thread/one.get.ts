import type { ChatThread } from '@/lib/api/types-db';
import { select } from '@/lib/sql';
import useDB from '@/src/composables/useDB';

const db = useDB();

export default async function getOne(id: string): Promise<ChatThread> {
	const sql = select('chat_thread', ['*'], { id });
	const thread = (await db.get(sql[0], sql[1])) as ChatThread;
	if (!thread) {
		throw new Error('Thread not found');
	}

	return thread;
}
