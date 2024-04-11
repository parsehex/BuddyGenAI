import z from 'zod';
import { getDB } from '../database/knex';

const querySchema = z.object({
	threadId: z.string(),
});

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		const db = await getDB();
		const { threadId } = await getValidatedQuery(event, (query) => querySchema.parse(query));

		const thread = await db('chat_thread').where({ id: +threadId }).first();
		if (!thread) {
			throw createError({ statusCode: 404, statusMessage: 'Thread not found' });
		}

		// delete all but the first message
		await db('chat_message').where({ thread_id: +threadId }).andWhere('thread_index', '>', 0).delete();
		return { success: true };
	});
});
