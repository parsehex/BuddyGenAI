import z from 'zod';
import { getDB } from '../database/knex';

const querySchema = z.object({
	id: z.string(),
});

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		const db = await getDB();
		const { id } = await getValidatedQuery(event, (query) => querySchema.parse(query));
		const message = await db('chat_message').where({ id }).first();
		if (!message) {
			throw createError({ statusCode: 404, statusMessage: 'Message not found' });
		}
		if (message.role !== 'user') {
			throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
		}
		const nextMessage = await db('chat_message')
			.where({ thread_id: message.thread_id, thread_index: message.thread_index + 1 })
			.first();
		console.log('nextMessage', nextMessage?.content);
		if (!nextMessage) {
			throw createError({ statusCode: 400, statusMessage: 'Cannot delete last message' });
		}
		await db('chat_message').where({ id }).delete();
		await db('chat_message').where({ id: nextMessage.id }).delete();
		return { success: true };
	});
});
