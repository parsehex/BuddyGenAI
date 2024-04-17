import z from 'zod';
import { getDB } from '~/server/database/knex';

const urlSchema = z.object({
	id: z.string(),
});

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		const db = await getDB();
		const { id } = await getValidatedRouterParams(event, (params) => urlSchema.parse(params));
		const persona = await db('persona').where({ id }).first();
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
