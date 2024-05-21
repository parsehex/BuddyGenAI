import type { ChatThread } from '@/lib/api/types-db';
import { select } from '@/lib/sql';
import useElectron from '@/composables/useElectron';

const { dbGet } = useElectron();

export default async function getOne(id: string): Promise<ChatThread> {
	if (!dbGet) throw new Error('dbGet is not defined');

	const sql = select('chat_thread', ['*'], { id });
	const thread = (await dbGet(sql[0], sql[1])) as ChatThread;
	if (!thread) {
		throw new Error('Thread not found');
	}

	return thread;
}
