import { del, select } from '@/lib/sql';
import useElectron from '@/composables/useElectron';
import type { DeleteResponse } from '@/lib/api/types-api';
import type { ChatMessage } from '@/lib/api/types-db';

const { dbGet, dbRun } = useElectron();

export default async function removeOne(id: string): Promise<DeleteResponse> {
	if (!dbGet || !dbRun) throw new Error('dbGet or dbRun is not defined');

	const sqlMessage = select('chat_message', ['*'], { id });
	const message = (await dbGet(sqlMessage[0], sqlMessage[1])) as ChatMessage;
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
	const nextMessage = (await dbGet(
		sqlNextMessage[0],
		sqlNextMessage[1]
	)) as ChatMessage;

	const sqlMessageDelete = del('chat_message', { id });
	await dbRun(sqlMessageDelete[0], sqlMessageDelete[1]);
	if (nextMessage) {
		// possible if failed to get response?
		console.log('Deleting next message', nextMessage);
		const sqlNextMessageDelete = del('chat_message', { id: nextMessage.id });
		await dbRun(sqlNextMessageDelete[0], sqlNextMessageDelete[1]);
	}
	return { success: true };
}
