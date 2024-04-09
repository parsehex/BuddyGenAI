// await knex.schema.createTable('chat_thread', (table) => {
// 	table.increments('id').primary();
// 	table.timestamp('created').notNullable();
// 	table.string('name').notNullable();
// 	table.integer('persona_id').unsigned();
// 	table.foreign('persona_id').references('persona.id');
// 	table.enum('mode', ['persona', 'custom']).notNullable();
// });

import { z } from 'zod';
import { getDB } from '../database/knex';

const querySchema = z.object({
	id: z.string()
});

// delete thread

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		const db = await getDB();
		const { id } = await getValidatedQuery(event, (body) => querySchema.parse(body));
		const thread = await db('chat_thread').where({ id: +id }).first();
		if (!thread) {
			throw createError({ statusCode: 404, statusMessage: 'Thread not found' });
		}
		await db('chat_thread').where({ id: +id }).delete();
		return { success: true };
	});
});
