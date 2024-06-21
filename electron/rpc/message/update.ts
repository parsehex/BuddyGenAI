import type {
	Buddy,
	BuddyVersion,
	BuddyVersionMerged,
	ChatMessage,
	ChatThread,
} from '@/types/db';
import { del, insert, select, update } from '@/sql';
import { all, get, run } from '@/modules/db';

interface UpdateMessageOptions {
	id: string;
	content?: string;
	image?: string;
	tts?: string;
}

export async function updateMessage({
	id,
	content,
	image,
	tts,
}: UpdateMessageOptions) {
	const sqlMessage = select('chat_message', ['*'], { id });
	const message = (await get(sqlMessage[0], sqlMessage[1])) as ChatMessage;
	if (!message) throw new Error('Message not found');

	const data = {
		updated: new Date().getTime(),
	} as Partial<ChatMessage>;
	if (content) data.content = content;
	if (image) data.image = image;
	if (tts) data.tts = tts;

	if (Object.keys(data).length === 1) throw new Error('No data to update');

	const sql = update('chat_message', data, { id });
	await run(sql[0], sql[1]);

	return { status: 'success', message: 'Message content updated successfully' };
}
