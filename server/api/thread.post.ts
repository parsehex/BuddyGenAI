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
			created: new Date(),
			name,
			persona_id,
			mode,
		})
		.returning('*');

	// also add a default message if mode is custom
	// TODO add system message instead
	if (mode === 'custom') {
		await db('chat_message').insert({
			created: new Date(),
			role: 'assistant',
			content: 'Hello! How can I help you today?',
			thread_id: thread.id,
			thread_index: 0,
		});
	}

	return thread;
});
