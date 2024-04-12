import z from 'zod';
import { getDB } from '../database/knex';

const bodySchema = z.object({
	id: z.string(),
	content: z.string(),
});

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		const db = await getDB();
		const { id, content } = await readValidatedBody(event, (body) => bodySchema.parse(body));

		const message = await db('chat_message').where({ id }).first();
		if (!message) {
			throw createError({ statusCode: 404, statusMessage: 'Message not found' });
		}

		await db('chat_message').where({ id }).update({
			updated: new Date().getTime(),
			content: content,
		});

		return { status: 'success', message: 'Message content updated successfully' };
	});
});
