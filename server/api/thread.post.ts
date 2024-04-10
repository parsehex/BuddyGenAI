import { getDB } from '../database/knex';
import z from 'zod';

// Create New Thread

const bodySchema = z.object({
	name: z.string(),
	persona_id: z.number().optional(),
	mode: z.literal('persona').or(z.literal('custom')),
});

export default defineEventHandler(async (event) => {
	const data = await readValidatedBody(event, (body) => bodySchema.parse(body));
	const { name, persona_id, mode } = data;

	const db = await getDB();
	const [thread] = await db('chat_thread')
		.insert({
			created: new Date().getTime(),
			name,
			persona_id,
			mode,
		})
		.returning('*');

	if (mode === 'custom') {
		await db('chat_message').insert({
			created: new Date().getTime(),
			role: 'system',
			content: 'The following is a chat between a human User and an embodied AI Assistant.',
			thread_id: thread.id,
			thread_index: 0,
		});
	}

	return thread;
});
