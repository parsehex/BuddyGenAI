import useElectron from '@/composables/useElectron';
import type {
	ChatMessage,
	ChatThread,
	Buddy,
	BuddyVersion,
} from '@/lib/api/types-db';
import { AppSettings } from '@/lib/api/AppSettings';
import * as prompt from '@/src/lib/prompt/buddy';
import { select } from '@/lib/sql';
import { v4 } from 'uuid';

const { dbGet, dbAll } = useElectron();

// TODO add format=openai option to api?

export default async function getAll(threadId: string): Promise<ChatMessage[]> {
	if (!dbGet) throw new Error('dbGet is not defined');

	const sqlThread = select('chat_thread', ['*'], { id: threadId });
	const thread = (await dbGet(sqlThread[0], sqlThread[1])) as ChatThread;
	if (!thread) {
		throw new Error('Thread not found');
	}

	const shouldReplaceSystem =
		thread.mode === 'persona' && thread.persona_mode_use_current;

	const sqlMessages = select('chat_message', ['*'], { thread_id: threadId });
	const messages = (await dbAll(
		sqlMessages[0],
		sqlMessages[1]
	)) as ChatMessage[];
	messages.sort((a, b) => a.thread_index - b.thread_index);

	if (shouldReplaceSystem && thread.persona_id) {
		const sqlBuddy = select('persona', ['*'], { id: thread.persona_id });
		const buddy = (await dbGet(sqlBuddy[0], sqlBuddy[1])) as Buddy;
		if (!buddy) {
			throw new Error('Buddy not found');
		}

		const sqlBuddyVersion = select('persona_version', ['*'], {
			id: buddy.current_version_id,
		});
		const buddyVersion = (await dbGet(
			sqlBuddyVersion[0],
			sqlBuddyVersion[1]
		)) as BuddyVersion;
		if (!buddyVersion) {
			throw new Error('Buddy version not found');
		}

		// update the system message on-the-fly
		const userName = AppSettings.get('user_name') as string;
		const systemMessage = prompt.fromPersonaDescription(
			userName,
			buddyVersion.name,
			buddyVersion.description
		);
		if (messages[0]?.role !== 'system') {
			messages.unshift({
				id: v4(),
				created: new Date().getTime(),
				updated: new Date().getTime(),
				role: 'system',
				content: systemMessage,
				image: null,
				tts: null,
				thread_id: threadId,
				thread_index: 0,
			});
			for (let i = 0; i < messages.length; i++) {
				messages[i].thread_index = i;
			}
		} else {
			messages[0].content = systemMessage;
		}
	}

	// log whether last message has tts
	// console.log(messages[messages.length - 1].tts);

	return messages || [];
}
