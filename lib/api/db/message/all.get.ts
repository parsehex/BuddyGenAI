import type {
	ChatMessage,
	ChatThread,
	Persona,
	PersonaVersion,
} from '../../types-db';
import AppSettings from '../../AppSettings';
import * as prompt from '../../../prompt/persona';
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

	if (shouldReplaceSystem && thread.persona_id) {
		const sqlPersona = select('persona', ['*'], { id: thread.persona_id });
		const persona = (await dbGet(sqlPersona[0], sqlPersona[1])) as Persona;
		if (!persona) {
			throw createError({ statusCode: 404, statusMessage: 'Persona not found' });
		}

		const sqlPersonaVersion = select('persona_version', ['*'], {
			id: persona.current_version_id,
		});
		const personaVersion = (await dbGet(
			sqlPersonaVersion[0],
			sqlPersonaVersion[1]
		)) as PersonaVersion;
		if (!personaVersion) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Persona version not found',
			});
		}
		const userName = AppSettings.get('user_name');
		messages[0].content = prompt.fromPersonaDescription(
			userName,
			personaVersion.name,
			personaVersion.description
		);
	}

	return messages || [];
}
