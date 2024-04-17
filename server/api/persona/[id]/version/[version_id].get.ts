import z from 'zod';
import { getDB } from '~/server/database/knex';

const urlSchema = z.object({
	id: z.string(),
	version_id: z.string(),
});

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		const db = await getDB();
		const { id, version_id } = await getValidatedRouterParams(event, (params) => urlSchema.parse(params));
		const persona = await db('persona').where({ id }).first();
		if (!persona) {
			throw createError({ statusCode: 404, statusMessage: 'Persona not found' });
		}

		const version = await db('persona_version').where({ id: version_id }).first();
		if (!version) {
			throw createError({ statusCode: 404, statusMessage: 'Version not found' });
		}
		return version;
	});
});
