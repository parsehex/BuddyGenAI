import z from 'zod';
import { getDB } from '../database/knex';

const querySchema = z.object({
	personaId: z.string(),
});

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		const db = await getDB();
		const { personaId } = await getValidatedQuery(event, (query) => querySchema.parse(query));
		const persona = await db('persona').where({ id: personaId }).first();
		if (!persona) {
			throw createError({ statusCode: 404, statusMessage: 'Persona not found' });
		}

		const currentVersion = await db('persona_version').where({ id: persona.current_version_id }).first();
		if (!currentVersion) {
			throw createError({ statusCode: 404, statusMessage: 'Current version not found' });
		}
		return currentVersion;
	});
});
