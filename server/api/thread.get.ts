import { z } from 'zod';
import { getDB } from '../database/knex';

const querySchema = z.object({
	id: z.string(),
});

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		const db = await getDB();
		const { id } = await getValidatedQuery(event, (body) => querySchema.parse(body));
		const thread = await db('chat_thread').where({ id: +id }).first();
		if (!thread) {
			throw createError({ statusCode: 404, statusMessage: 'Thread not found' });
		}
		return thread;
	});
});
