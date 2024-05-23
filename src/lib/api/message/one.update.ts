import { select, update } from '@/lib/sql';
import useElectron from '@/composables/useElectron';
import type { ChatMessage } from '@/lib/api/types-db';

const { dbGet, dbRun } = useElectron();

export default async function updateOne(
	id: string,
	content: string,
	image?: string
) {
	if (!dbGet || !dbRun) throw new Error('dbGet or dbRun is not defined');

	const sqlMessage = select('chat_message', ['*'], { id });
	const message = (await dbGet(sqlMessage[0], sqlMessage[1])) as ChatMessage;
	if (!message) {
		throw new Error('Message not found');
	}

	const data = {
		updated: new Date().getTime(),
		content,
	} as Partial<ChatMessage>;
	if (image) data.image = image;
	const sql = update('chat_message', data, { id });
	await dbRun(sql[0], sql[1]);

	return { status: 'success', message: 'Message content updated successfully' };
}
