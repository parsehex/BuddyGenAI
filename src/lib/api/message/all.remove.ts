import { del, select } from '@/lib/sql';
import type { DeleteResponse } from '@/lib/api/types-api';
import useDB from '@/src/composables/useDB';

const db = useDB();

/** Delete all messages except the system message */
export default async function removeAll(
	threadId: string
): Promise<DeleteResponse> {
	const sqlThread = select('chat_thread', ['*'], { id: threadId });
	const thread = await db.get(sqlThread[0], sqlThread[1]);
	if (!thread) {
		throw new Error('Thread not found');
	}

	const uSqlMessages = del('chat_message', {
		thread_id: threadId,
		role: 'user',
	});
	await db.run(uSqlMessages[0], uSqlMessages[1]);
	const aSqlMessages = del('chat_message', {
		thread_id: threadId,
		role: 'assistant',
	});
	await db.run(aSqlMessages[0], aSqlMessages[1]);
	return { success: true };
}
