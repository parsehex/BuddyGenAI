import { v4 as uuidv4 } from 'uuid';
import type { ChatThread, BuddyVersionMerged } from '@/types/db';
import { del, insert, select, update } from '@//sql';
import type { DeleteResponse, UpdateBuddyOptions } from '@/types/api';
import { all, get, run } from '@/modules/db';
import { removeAllMessages } from '@/rpc/message/remove';

export async function removeAllBuddyThreads(
	buddyId: string
): Promise<DeleteResponse> {
	const sql = select('chat_thread', ['*'], { persona_id: buddyId });
	const threads = (await all(sql[0], sql[1])) as ChatThread[];

	for (const thread of threads) {
		await removeThread(thread.id);
	}

	return { success: true };
}

export async function removeThread(threadId: string): Promise<DeleteResponse> {
	const sqlThread = select('chat_thread', ['*'], { id: threadId });
	const thread = await get(sqlThread[0], sqlThread[1]);
	if (!thread) {
		throw new Error('Thread not found');
	}

	await removeAllMessages(threadId);

	const sql = del('chat_thread', { id: threadId });
	await run(sql[0], sql[1]);
	return { success: true };
}
