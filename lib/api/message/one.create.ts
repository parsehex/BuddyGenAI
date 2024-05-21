import { v4 as uuidv4 } from 'uuid';
import useElectron from '@/composables/useElectron';
import { insert, select } from '@/lib/sql';

const { dbGet, dbAll, dbRun } = useElectron();

// TODO need to serve this from express
// https://sdk.vercel.ai/docs/guides/frameworks/solidjs#on-the-server

// TODO rewrite
// dont handle openai stuff here but only saving to db

interface Message {
	role: 'user' | 'assistant';
	content: string;
}

export default async function createMessage(
	threadId: string,
	message: Message
) {
	if (!dbGet || !dbRun) throw new Error('dbGet or dbRun is not defined');

	const sqlThread = select('chat_thread', ['*'], { id: threadId });
	const thread = await dbGet(sqlThread[0], sqlThread[1]);
	if (!thread) {
		throw new Error('Thread not found');
	}

	const sqlMessages = select('chat_message', ['*'], { thread_id: threadId });
	const messages = await dbAll(sqlMessages[0], sqlMessages[1]);
	messages.sort((a: any, b: any) => a.thread_index - b.thread_index);
	const lastMessage = messages[messages.length - 1];

	const threadIndex = lastMessage ? lastMessage.thread_index + 1 : 0;

	const sqlInsert = insert('chat_message', {
		id: uuidv4(),
		created: new Date().getTime(),
		role: message.role,
		content: message.content,
		thread_id: threadId,
		thread_index: threadIndex,
	});
	await dbRun(sqlInsert[0], sqlInsert[1]);
}
