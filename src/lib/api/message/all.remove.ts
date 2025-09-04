import { del, select } from '@/lib/sql';
import useElectron from '@/composables/useElectron';
import type { DeleteResponse } from '@/lib/api/types-api';

const { dbRun, dbGet } = useElectron();

/** Delete all messages except the system message */
export default async function removeAll(
	threadId: string
): Promise<DeleteResponse> {
	if (!dbGet || !dbRun) throw new Error('dbGet or dbRun is not defined');

	const sqlThread = select('chat_thread', ['*'], { id: threadId });
	const thread = await dbGet(sqlThread[0], sqlThread[1]);
	if (!thread) {
		throw new Error('Thread not found');
	}

	const uSqlMessages = del('chat_message', {
		thread_id: threadId,
		role: 'user',
	});
	await dbRun(uSqlMessages[0], uSqlMessages[1]);
	const aSqlMessages = del('chat_message', {
		thread_id: threadId,
		role: 'assistant',
	});
	await dbRun(aSqlMessages[0], aSqlMessages[1]);
	return { success: true };
}
