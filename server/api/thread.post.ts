import { promptFromPersonaDescription } from '~/lib/prompt/persona';
import { getDB } from '../database/knex';
import z from 'zod';
import type { Persona } from '../database/types';
import { v4 as uuidv4 } from 'uuid';

// Create New Thread

const bodySchema = z.object({
	name: z.string(),
	persona_id: z.string().optional(),
	mode: z.literal('persona').or(z.literal('custom')),
});

export default defineEventHandler(async (event) => {
	const data = await readValidatedBody(event, (body) => bodySchema.parse(body));
	const { name, persona_id, mode } = data;

	const db = await getDB();
	const [thread] = await db('chat_thread')
		.insert({
			id: uuidv4(),
			created: new Date().getTime(),
			name,
			persona_id,
			mode,
		})
		.returning('*');

	if (mode === 'custom') {
		await db('chat_message').insert({
			id: uuidv4(),
			created: new Date().getTime(),
			role: 'system',
			content: 'The following is a chat between a human User and an embodied AI Assistant.',
			thread_id: thread.id,
			thread_index: 0,
		});
	} else if (mode === 'persona') {
		const persona = (await db('persona').where({ id: persona_id }).first()) as Persona;
		if (persona) {
			await db('chat_message').insert({
				id: uuidv4(),
				created: new Date().getTime(),
				role: 'system',
				content: promptFromPersonaDescription(persona.name, persona.description || ''),
				thread_id: thread.id,
				thread_index: 0,
			});
		} else {
			console.error(`Persona ID-${persona_id} not found (was it deleted?)`);
		}
	}

	return thread;
});
