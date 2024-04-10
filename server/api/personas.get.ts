import { getDB } from '../database/knex';

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		const db = await getDB();
		const personas = await db('persona').select();
		return personas;
	});
});
