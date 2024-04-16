import z from 'zod';
import { getDB } from '../database/knex';
import * as prompt from '~/lib/prompt/persona';
import AppSettings from '../AppSettings';

const querySchema = z.object({
	threadId: z.string(),
});

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		const db = await getDB();
		const { threadId } = await getValidatedQuery(event, (query) => querySchema.parse(query));

		const thread = await db('chat_thread').where({ id: threadId }).first();
		if (!thread) {
			throw createError({ statusCode: 404, statusMessage: 'Thread not found' });
		}

		const shouldReplaceSystem = thread.mode === 'persona' && thread.persona_mode_use_current;

		const messages = await db('chat_message').where({ thread_id: threadId }).select();

		if (shouldReplaceSystem && thread.persona_id) {
			const persona = await db('persona').where({ id: thread.persona_id }).first();
			if (!persona) {
				throw createError({ statusCode: 404, statusMessage: 'Persona not found' });
			}
			const personaVersion = await db('persona_version').where({ id: persona.current_version_id }).first();
			if (!personaVersion) {
				throw createError({ statusCode: 404, statusMessage: 'Persona version not found' });
			}
			const userName = AppSettings.get('user_name');
			messages[0].content = prompt.fromPersonaDescription(userName, personaVersion.name, personaVersion.description);
		}

		return messages || [];
	});
});
