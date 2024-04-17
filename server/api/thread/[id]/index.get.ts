import { z } from 'zod';
import { getDB } from '~/server/database/knex';

const urlSchema = z.object({
	id: z.string(),
});

export default defineLazyEventHandler(async () => {
	const db = await getDB();
	return defineEventHandler(async (event) => {
		const { id } = await getValidatedRouterParams(event, (params) => urlSchema.parse(params));
		const thread = await db('chat_thread').where({ id }).first();
		if (!thread) {
			throw createError({ statusCode: 404, statusMessage: 'Thread not found' });
		}
		return thread;
	});
});
