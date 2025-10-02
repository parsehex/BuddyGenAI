import * as prompt from '@/src/lib/prompt/buddy';
import { AppSettings } from '@/lib/api/AppSettings';
import type {
	ChatMessage,
	ChatThread,
	Buddy,
	BuddyVersion,
} from '@/lib/api/types-db';
import { select, update } from '@/lib/sql';
import useDB from '@/src/composables/useDB';

const db = useDB();

export default async function updateSystemMessage(
	threadId: string
): Promise<ChatMessage> {
	const sqlThread = select('chat_thread', ['*'], { id: threadId });
	const thread = (await db.get(sqlThread[0], sqlThread[1])) as ChatThread;
	if (!thread) {
		throw new Error('Thread not found');
	}
	if (thread.mode !== 'persona') {
		throw new Error('Thread is not a Buddy thread');
	}
	if (!thread.persona_id) {
		throw new Error('Thread does not have a Buddy selected');
	}

	const sqlBuddy = select('persona', ['*'], { id: thread.persona_id });
	const buddy = (await db.get(sqlBuddy[0], sqlBuddy[1])) as Buddy;
	if (!buddy) {
		throw new Error('Buddy not found');
	}

	const sqlBuddyVersion = select('persona_version', ['*'], {
		id: buddy.current_version_id,
	});
	const buddyVersion = (await db.get(
		sqlBuddyVersion[0],
		sqlBuddyVersion[1]
	)) as BuddyVersion;
	if (!buddyVersion) {
		throw new Error('Current version of Buddy not found');
	}

	const userName = AppSettings.get('user_name') as string;

	const content = prompt.fromPersonaDescription(
		userName,
		buddyVersion.name,
		buddyVersion.description || ''
	);
	const sqlFirstMessage = update(
		'chat_message',
		{ content },
		{ thread_id: thread.id, thread_index: 0 }
	);
	await db.run(sqlFirstMessage[0], sqlFirstMessage[1]);

	const sqlGetFirstMessage = select('chat_message', ['*'], {
		thread_id: thread.id,
		thread_index: 0,
	});
	const firstMessage = (await db.get(
		sqlGetFirstMessage[0],
		sqlGetFirstMessage[1]
	)) as ChatMessage;

	return firstMessage;
}
