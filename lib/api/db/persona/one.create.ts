import { v4 as uuidv4 } from 'uuid';
import type { PersonaVersionMerged } from '@/lib/api/types-db';
import { insert, select } from '@/lib/sql';

const { dbGet, dbRun } = useElectron();

interface CreatePersonaOptions {
	name: string;
	description?: string;
	profile_pic?: string;
	profile_pic_prompt?: string;
	profile_pic_use_prompt?: boolean;
}

export default async function createOne({
	name,
	description,
	profile_pic,
	profile_pic_prompt,
	profile_pic_use_prompt = true,
}: CreatePersonaOptions): Promise<PersonaVersionMerged> {
	if (!dbGet || !dbRun) throw new Error('dbGet or dbRun is not defined');

	if (!name) {
		throw new Error('Name is required');
	}

	const firstVersionId = uuidv4();
	const personaId = uuidv4();

	const sqlPersona = insert('persona', {
		id: personaId,
		created: new Date().getTime(),
		current_version_id: firstVersionId,
		profile_pic,
		profile_pic_prompt,
		profile_pic_use_prompt,
	});
	const [persona] = (await dbRun(
		sqlPersona[0],
		sqlPersona[1]
	)) as PersonaVersionMerged[];

	const sqlPersonaVersion = insert('persona_version', {
		id: firstVersionId,
		created: new Date().getTime(),
		persona_id: personaId,
		version: 1,
		name,
		description,
	});
	await dbRun(sqlPersonaVersion[0], sqlPersonaVersion[1]);

	return {
		...persona,
		name,
		description,
	} as PersonaVersionMerged;
}
