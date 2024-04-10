import { z } from 'zod';
import { getDB } from '../database/knex';

const querySchema = z.object({
	id: z.string(),
});

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		const db = await getDB();
		const { id } = await getValidatedQuery(event, (query) => querySchema.parse(query));
		const persona = await db('persona').where({ id: +id }).first();
		if (!persona) {
			throw createError({ statusCode: 404, statusMessage: 'Persona not found' });
		}
		return persona;
	});
});
