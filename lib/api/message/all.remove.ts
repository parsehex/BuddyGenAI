import { del, select } from '@/lib/sql';
import useElectron from '@/composables/useElectron';
import type { DeleteResponse } from '@/lib/api/types-api';

const { dbRun, dbGet } = useElectron();

export default async function removeAll(
	threadId: string
): Promise<DeleteResponse> {
	if (!dbGet || !dbRun) throw new Error('dbGet or dbRun is not defined');

	const sqlThread = select('chat_thread', ['*'], { id: threadId });
	const thread = await dbGet(sqlThread[0], sqlThread[1]);
	if (!thread) {
		throw new Error('Thread not found');
	}

	const sqlMessages = del('chat_message', { thread_id: threadId });
	await dbRun(sqlMessages[0], sqlMessages[1]);
	return { success: true };
}
