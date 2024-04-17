import { z } from 'zod';
import { getDB } from '~/server/database/knex';

const urlSchema = z.object({
	id: z.string(),
});

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		const db = await getDB();
		const { id } = await getValidatedRouterParams(event, (params) => urlSchema.parse(params));
		const thread = await db('chat_thread').where({ id }).first();
		if (!thread) {
			throw createError({ statusCode: 404, statusMessage: 'Thread not found' });
		}
		await db('chat_thread').where({ id }).delete();
		return { success: true };
	});
});
