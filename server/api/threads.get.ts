// await knex.schema.createTable('chat_thread', (table) => {
// 	table.increments('id').primary();
// 	table.timestamp('created').notNullable();
// 	table.string('name').notNullable();
// 	table.integer('persona_id').unsigned();
// 	table.foreign('persona_id').references('persona.id');
// 	table.enum('mode', ['persona', 'custom']).notNullable();
// });

import { getDB } from '../database/knex';

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		const db = await getDB();
		const threads = await db('chat_thread').select();
		return threads;
	});
});
