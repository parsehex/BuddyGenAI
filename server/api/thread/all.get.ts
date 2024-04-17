import z from 'zod';
import { getDB } from '~/server/database/knex';

const querySchema = z.object({
	persona_id: z.string().optional(),
});

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		const { persona_id } = await getValidatedQuery(event, (query) => querySchema.parse(query));
		const db = await getDB();
		if (persona_id) {
			const threads = await db('chat_thread').where({ persona_id: persona_id }).select();
			return threads || [];
		}

		const threads = await db('chat_thread').select();
		return threads || [];
	});
});
