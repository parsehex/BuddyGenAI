import { del, select } from '@/lib/sql';
import type { DeleteResponse } from '@/lib/api/types-api';
import type { ChatMessage } from '@/lib/api/types-db';
import useDB from '@/src/composables/useDB';

const db = useDB();

export default async function removeOne(id: string): Promise<DeleteResponse> {
	const sqlMessage = select('chat_message', ['*'], { id });
	const message = (await db.get(sqlMessage[0], sqlMessage[1])) as ChatMessage;
	if (!message) {
		throw new Error('Message not found');
	}

	const sqlNextMessage = select('chat_message', ['*'], {
		thread_id: message.thread_id,
		thread_index: message.thread_index + 1,
	});
	const nextMessage = (await db.get(
		sqlNextMessage[0],
		sqlNextMessage[1]
	)) as ChatMessage;

	const sqlMessageDelete = del('chat_message', { id });
	await db.run(sqlMessageDelete[0], sqlMessageDelete[1]);
	if (nextMessage) {
		// possible if failed to get response?
		const sqlNextMessageDelete = del('chat_message', { id: nextMessage.id });
		await db.run(sqlNextMessageDelete[0], sqlNextMessageDelete[1]);
	}
	return { success: true };
}
