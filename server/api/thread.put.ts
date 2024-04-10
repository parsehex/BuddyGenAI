import { getDB } from '../database/knex';
import z from 'zod';

// Update Existing Thread

const bodySchema = z.object({
	id: z.number(),
	name: z.string().optional(),
	persona_id: z.number().optional(),
	mode: z.literal('persona').or(z.literal('custom')).optional(),
});

export default defineEventHandler(async (event) => {
	const data = await readValidatedBody(event, (body) => bodySchema.parse(body));
	const { id, name, persona_id, mode } = data;

	const db = await getDB();
	const [thread] = await db('chat_thread')
		.where({ id })
		.update({
			name,
			persona_id,
			mode,
		})
		.returning('*');

	return thread;
});
