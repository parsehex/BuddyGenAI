import type {
	Buddy,
	BuddyVersion,
	BuddyVersionMerged,
	ChatMessage,
	ChatThread,
} from '@/types/db';
import { insert, select } from '@/sql';
import { all, get, run } from '@/modules/db';
import { v4 } from 'uuid';

interface Message {
	role: 'user' | 'assistant';
	content: string;
}

export async function createMessage({
	threadId,
	message,
	image,
	tts,
}: {
	threadId: string;
	message: Message;
	image?: string;
	tts?: string;
}) {
	const sqlThread = select('chat_thread', ['*'], { id: threadId });
	const thread = await get(sqlThread[0], sqlThread[1]);
	if (!thread) {
		throw new Error('Thread not found');
	}

	const sqlMessages = select('chat_message', ['*'], { thread_id: threadId });
	const messages = (await all(sqlMessages[0], sqlMessages[1])) as ChatMessage[];
	messages.sort((a: any, b: any) => a.thread_index - b.thread_index);
	const lastMessage = messages[messages.length - 1];

	const threadIndex = lastMessage ? lastMessage.thread_index + 1 : 0;

	const sqlInsert = insert('chat_message', {
		id: v4(),
		created: new Date().getTime(),
		role: message.role,
		content: message.content,
		image: image || '',
		tts: tts || '',
		thread_id: threadId,
		thread_index: threadIndex,
	});
	const res = await run(sqlInsert[0], sqlInsert[1]);
}
