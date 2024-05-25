import useElectron from '@/composables/useElectron';
import type {
	ChatMessage,
	ChatThread,
	Buddy,
	BuddyVersion,
} from '@/lib/api/types-db';
import { AppSettings } from '@/lib/api/AppSettings';
import * as prompt from '@/lib/prompt/persona';
import { select } from '@/lib/sql';

const { dbGet, dbAll } = useElectron();

// TODO add format=openai option to api?

export default async function getAll(threadId: string): Promise<ChatMessage[]> {
	if (!dbGet) throw new Error('dbGet is not defined');

	const sqlThread = select('chat_thread', ['*'], { id: threadId });
	const thread = (await dbGet(sqlThread[0], sqlThread[1])) as ChatThread;

	const shouldReplaceSystem =
		thread.mode === 'persona' && thread.persona_mode_use_current;

	const sqlMessages = select('chat_message', ['*'], { thread_id: threadId });
	const messages = (await dbAll(
		sqlMessages[0],
		sqlMessages[1]
	)) as ChatMessage[];
	const hasSystemMessage = messages[0]?.role === 'system';

	console.log(messages);

	if (shouldReplaceSystem && thread.persona_id) {
		const sqlPersona = select('persona', ['*'], { id: thread.persona_id });
		const persona = (await dbGet(sqlPersona[0], sqlPersona[1])) as Buddy;
		if (!persona) {
			// throw createError({ statusCode: 404, statusMessage: 'Persona not found' });
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
			// throw createError({
			// 	statusCode: 404,
			// 	statusMessage: 'Persona version not found',
			// });
			throw new Error('Persona version not found');
		}

		if (!hasSystemMessage) {
			const userName = AppSettings.get('user_name') as string;
			messages.unshift({
				id: '',
				created: new Date().getTime(),
				updated: new Date().getTime(),
				role: 'system',
				content: prompt.fromPersonaDescription(
					userName,
					personaVersion.name,
					personaVersion.description
				),
				image: null,
				tts: null,
				thread_id: threadId,
				thread_index: 0,
			});
		} else {
			const userName = AppSettings.get('user_name') as string;
			messages[0].content = prompt.fromPersonaDescription(
				userName,
				personaVersion.name,
				personaVersion.description
			);
		}
	}

	// log whether last message has tts
	// console.log(messages[messages.length - 1].tts);

	return messages || [];
}
