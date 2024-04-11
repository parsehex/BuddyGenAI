import { getDB } from '../database/knex';
import z from 'zod';

const querySchema = z.object({
	threadId: z.string(),
});

export default defineEventHandler(async (event) => {
	const data = await getValidatedQuery(event, (body) => querySchema.parse(body));

	const db = await getDB();
	const thread = await db('chat_thread').where({ id: +data.threadId }).first();

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

	const content = `The following is a chat between a human User and an Assistant playing the role of ${persona.name}. Description of ${persona.name} that Assistant follows faithfully:\n${persona.description}`;
	const [firstMessage] = await db('chat_message').where({ thread_id: thread.id, thread_index: 0 }).update({ content }).returning('*');

	return firstMessage;
});
