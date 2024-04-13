import { z } from 'zod';
import { getDB } from '../database/knex';
import type { PersonaVersionMerged } from '../database/types';

// TODO allow specifying version (latest or specific)
const querySchema = z.object({
	id: z.string(),
});

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		const db = await getDB();
		const { id } = await getValidatedQuery(event, (query) => querySchema.parse(query));
		const persona = await db('persona').where({ id }).first();
		if (!persona) {
			throw createError({ statusCode: 404, statusMessage: 'Persona not found' });
		}
		const currentVersion = await db('persona_version').where({ id: persona.current_version_id }).first();
		if (!currentVersion) {
			throw createError({ statusCode: 404, statusMessage: 'Current version of persona not found' });
		}
		return {
			...persona,
			name: currentVersion.name,
			description: currentVersion.description,
		} as PersonaVersionMerged;
	});
});
