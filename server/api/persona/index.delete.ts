import { z } from 'zod';
import { getDB } from '../../database/knex';

const querySchema = z.object({
	id: z.string(),
});

// delete persona
// TODO if we delete persona, should remove from threads (+ reset mode to custom)

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		const db = await getDB();
		const { id } = await getValidatedQuery(event, (query) => querySchema.parse(query));
		const persona = await db('persona').where({ id }).first();
		if (!persona) {
			throw createError({ statusCode: 404, statusMessage: 'Persona not found' });
		}
		await db('persona').where({ id }).delete();
		// delete all versions of persona
		await db('persona_version').where({ persona_id: id }).delete();
		return { success: true };
	});
});
