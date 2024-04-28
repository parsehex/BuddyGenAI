import * as prompt from '@/lib/prompt/persona';
import AppSettings from '../../AppSettings';
import type {
	ChatMessage,
	ChatThread,
	Buddy,
	BuddyVersion,
} from '@/lib/api/types-db';
import { select, update } from '@/lib/sql';

const { dbGet, dbRun } = useElectron();

export default async function updateSystemMessage(
	threadId: string
): Promise<ChatMessage> {
	if (!dbGet) throw new Error('dbGet is not defined');

	const sqlThread = select('chat_thread', ['*'], { id: threadId });
	const thread = (await dbGet(sqlThread[0], sqlThread[1])) as ChatThread;
	if (!thread) {
		throw new Error('Thread not found');
	}
	if (thread.mode !== 'persona') {
		throw new Error('Thread is not a persona thread');
	}
	if (!thread.persona_id) {
		throw new Error('Thread does not have a persona selected');
	}

	const sqlPersona = select('persona', ['*'], { id: thread.persona_id });
	const persona = (await dbGet(sqlPersona[0], sqlPersona[1])) as Buddy;
	if (!persona) {
		throw new Error('Persona not found');
	}

	const sqlPersonaVersion = select('persona_version', ['*'], {
		id: persona.current_version_id,
	});
	const personaVersion = (await dbGet(
		sqlPersonaVersion[0],
		sqlPersonaVersion[1]
	)) as BuddyVersion;
	if (!personaVersion) {
		throw new Error('Current version of persona not found');
	}

	const userName = AppSettings.get('user_name');

	const content = prompt.fromPersonaDescription(
		userName,
		personaVersion.name,
		personaVersion.description || ''
	);
	const sqlFirstMessage = update(
		'chat_message',
		{ content },
		{ thread_id: thread.id, thread_index: 0 }
	);
	await dbRun(sqlFirstMessage[0], sqlFirstMessage[1]);

	const sqlGetFirstMessage = select('chat_message', ['*'], {
		thread_id: thread.id,
		thread_index: 0,
	});
	const firstMessage = (await dbGet(
		sqlGetFirstMessage[0],
		sqlGetFirstMessage[1]
	)) as ChatMessage;

	return firstMessage;
}
