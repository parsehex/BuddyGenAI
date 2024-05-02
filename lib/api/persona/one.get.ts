import type { BuddyVersionMerged } from '@/lib/api/types-db';
import { select } from '@/lib/sql';

const { dbGet } = useElectron();

export default async function getOne(id: string): Promise<BuddyVersionMerged> {
	if (!dbGet) throw new Error('dbGet is not defined');

	const sqlPersona = select('persona', ['*'], { id });
	const persona = (await dbGet(
		sqlPersona[0],
		sqlPersona[1]
	)) as BuddyVersionMerged;
	if (!persona) {
		throw new Error('Persona not found');
	}

	const sqlCurrentVersion = select('persona_version', ['*'], {
		id: persona.current_version_id,
	});
	const currentVersion = (await dbGet(
		sqlCurrentVersion[0],
		sqlCurrentVersion[1]
	)) as BuddyVersionMerged;
	if (!currentVersion) {
		throw new Error('Current version of persona not found');
	}

	return {
		...persona,
		name: currentVersion.name,
		description: currentVersion.description,
	} as BuddyVersionMerged;
}
