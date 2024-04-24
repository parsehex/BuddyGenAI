import type { PersonaVersionMerged } from '@/lib/api/types-db';
import { select } from '@/lib/sql';

const { dbGet, dbAll } = useElectron();

export default async function getAll(): Promise<PersonaVersionMerged[]> {
	if (!dbGet || !dbAll) throw new Error('dbGet or dbAll is not defined');

	const sqlPersonas = select('persona', ['*']);
	const personas = await dbAll(sqlPersonas[0], sqlPersonas[1]);

	if (!personas?.length) {
		return [];
	}

	const currentVersions = await Promise.all(
		personas.map(async (persona: PersonaVersionMerged) => {
			const sqlCurrentVersion = select('persona_version', ['*'], {
				id: persona.current_version_id,
			});
			const currentVersion = (await dbGet(
				sqlCurrentVersion[0],
				sqlCurrentVersion[1]
			)) as PersonaVersionMerged;
			if (!currentVersion) {
				throw new Error('Current version of persona not found');
			}
			return {
				...persona,
				name: currentVersion.name,
				description: currentVersion.description,
			};
		})
	);

	return currentVersions;
}
