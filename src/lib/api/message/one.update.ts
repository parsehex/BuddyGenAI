import { select, update } from '@/lib/sql';
import type { ChatMessage } from '@/lib/api/types-db';
import useDB from '@/src/composables/useDB';

const db = useDB();

export default async function updateOne(
	id: string,
	content?: string,
	image?: string,
	tts?: string
) {
	const sqlMessage = select('chat_message', ['*'], { id });
	const message = (await db.get(sqlMessage[0], sqlMessage[1])) as ChatMessage;
	if (!message) throw new Error('Message not found');

	const data = {
		updated: new Date().getTime(),
	} as Partial<ChatMessage>;
	if (typeof content === 'string') data.content = content;
	if (typeof image === 'string') data.image = image;
	if (typeof tts === 'string') data.tts = tts;

	if (Object.keys(data).length === 1) throw new Error('No data to update');

	const sql = update('chat_message', data, { id });
	await db.run(sql[0], sql[1]);

	return { status: 'success', message: 'Message content updated successfully' };
}
