import { getDB } from '../database/knex';

// TODO option to set version

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		const db = await getDB();
		const personas = await db('persona').select();
		// get current version for each persona
		const currentVersions = await Promise.all(
			personas.map(async (persona) => {
				const currentVersion = await db('persona_version').where({ id: persona.current_version_id }).first();
				return {
					...persona,
					name: currentVersion.name,
					description: currentVersion.description,
				};
			})
		);
		return currentVersions;
	});
});
