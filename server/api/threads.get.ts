import z from 'zod';
import { getDB } from '../database/knex';

const querySchema = z.object({
	personaId: z.string().optional(),
});

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		const { personaId } = await getValidatedQuery(event, (query) => querySchema.parse(query));
		const db = await getDB();
		if (personaId) {
			const threads = await db('chat_thread').where({ persona_id: personaId }).select();
			return threads || [];
		}

		const threads = await db('chat_thread').select();
		return threads || [];
	});
});
