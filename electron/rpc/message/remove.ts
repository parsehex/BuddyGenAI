import type {
	Buddy,
	BuddyVersion,
	BuddyVersionMerged,
	ChatMessage,
	ChatThread,
} from '@/types/db';
import { del, insert, select } from '@/sql';
import { all, get, run } from '@/modules/db';
import { DeleteResponse } from '@/shared/types/api';

export async function removeAllMessages(
	threadId: string
): Promise<DeleteResponse> {
	const sqlThread = select('chat_thread', ['*'], { id: threadId });
	const thread = await get(sqlThread[0], sqlThread[1]);
	if (!thread) {
		throw new Error('Thread not found');
	}

	const sqlMessages = del('chat_message', { thread_id: threadId });
	await run(sqlMessages[0], sqlMessages[1]);
	return { success: true };
}

export async function removeMessage(
	messageId: string
): Promise<DeleteResponse> {
	const sqlMessage = select('chat_message', ['*'], { id: messageId });
	const message = (await get(sqlMessage[0], sqlMessage[1])) as ChatMessage;
	if (!message) {
		throw new Error('Message not found');
	}

	if (message.role !== 'user') {
		throw new Error('Forbidden');
	}

	const sqlNextMessage = select('chat_message', ['*'], {
		thread_id: message.thread_id,
		thread_index: message.thread_index + 1,
	});
	const nextMessage = (await get(
		sqlNextMessage[0],
		sqlNextMessage[1]
	)) as ChatMessage;

	const sqlMessageDelete = del('chat_message', { id: messageId });
	await run(sqlMessageDelete[0], sqlMessageDelete[1]);
	if (nextMessage) {
		// possible if failed to get response?
		const sqlNextMessageDelete = del('chat_message', { id: nextMessage.id });
		await run(sqlNextMessageDelete[0], sqlNextMessageDelete[1]);
	}
	return { success: true };
}
