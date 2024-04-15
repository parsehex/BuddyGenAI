import { promptFromPersonaDescription } from '~/lib/prompt/persona';
import { getDB } from '../database/knex';
import z from 'zod';
import AppSettings from '../AppSettings';

// TODO add batching

const querySchema = z.object({
	threadId: z.string(),
});

export default defineEventHandler(async (event) => {
	const data = await getValidatedQuery(event, (body) => querySchema.parse(body));

	const db = await getDB();
	const thread = await db('chat_thread').where({ id: data.threadId }).first();

	if (thread?.mode !== 'persona') {
		throw new Error('Thread is not a persona thread');
	}
	if (!thread.persona_id) {
		throw new Error('Thread does not have a persona selected');
	}

	// update the first/system message using template above with persona's current description
	const persona = await db('persona').where({ id: thread.persona_id }).first();
	if (!persona) {
		throw new Error('Persona not found');
	}
	const personaVersion = await db('persona_version').where({ id: persona.current_version_id }).first();
	if (!personaVersion) {
		throw new Error('Current version of persona not found');
	}

	const userName = AppSettings.get('user_name');

	const content = promptFromPersonaDescription(userName, personaVersion.name, personaVersion.description || '');
	const [firstMessage] = await db('chat_message').where({ thread_id: thread.id, thread_index: 0 }).update({ content }).returning('*');

	return firstMessage;
});
