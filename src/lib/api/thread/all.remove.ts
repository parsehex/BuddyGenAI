import type {
	ChatMessage,
	ChatThread,
	MergedChatThread,
	Buddy,
} from '@/lib/api/types-db';
import { select } from '@/lib/sql';
import type { DeleteResponse } from '../types-api';
import { api } from '..';
import useDB from '@/src/composables/useDB';

const db = useDB();

export default async function removeAllThreads(
	buddy_id: string
): Promise<DeleteResponse> {
	const sql = select('chat_thread', ['*'], { persona_id: buddy_id });
	const threads = (await db.all(sql[0], sql[1])) as ChatThread[];

	for (const thread of threads) {
		await api.thread.removeOne(thread.id);
	}

	return { success: true };
}
