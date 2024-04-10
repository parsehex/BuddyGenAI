import { getDB } from '../database/knex';

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		const db = await getDB();
		const threads = await db('chat_thread').select();
		return threads;
	});
});
