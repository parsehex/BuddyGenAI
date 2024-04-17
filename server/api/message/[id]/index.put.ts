import z from 'zod';
import { getDB } from '~/server/database/knex';

const urlSchema = z.object({
	id: z.string(),
});
const bodySchema = z.object({
	content: z.string(),
});

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		const { id } = await getValidatedRouterParams(event, (params) => urlSchema.parse(params));
		const db = await getDB();
		const { content } = await readValidatedBody(event, (body) => bodySchema.parse(body));

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
