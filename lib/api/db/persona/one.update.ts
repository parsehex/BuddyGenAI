import { v4 as uuidv4 } from 'uuid';
import type { PersonaVersionMerged } from '@/lib/api/types-db';
import { insert, select, update } from '@/lib/sql';

const { dbGet, dbRun } = useElectron();

interface UpdatePersonaOptions {
	id: string;
	name?: string;
	description?: string;
	profile_pic?: string;
	profile_pic_prompt?: string;
	profile_pic_use_prompt?: boolean;
}

export default async function updateOne({
	id,
	name,
	description,
	profile_pic,
	profile_pic_prompt,
	profile_pic_use_prompt = true,
}: UpdatePersonaOptions): Promise<PersonaVersionMerged> {
	if (!dbGet || !dbRun) throw new Error('dbGet or dbRun is not defined');
	if (!id) {
		throw new Error('Persona ID is required');
	}

	let returningPersona: PersonaVersionMerged = null as any;

	const sqlPersona = select('persona', ['*'], { id });
	let persona = (await dbGet(
		sqlPersona[0],
		sqlPersona[1]
	)) as PersonaVersionMerged;
	if (!persona) {
		throw new Error('Persona not found');
	}

	const sqlCurrentVersion = select('persona_version', ['*'], {
		id: persona.current_version_id,
	});
	const currentVersion = (await dbGet(
		sqlCurrentVersion[0],
		sqlCurrentVersion[1]
	)) as PersonaVersionMerged;
	if (!currentVersion) {
		throw new Error('Current version not found');
	}

	const makeNewVersion = !!(name || description);

	if (makeNewVersion) {
		returningPersona = { ...persona };

		const newVersionId = uuidv4();
		const newVersion = currentVersion.version + 1;
		const versionName = name || currentVersion.name;
		const versionDescription = description || currentVersion.description;

		const sqlNewVersion = insert('persona_version', {
			id: newVersionId,
			created: new Date().getTime(),
			persona_id: id,
			version: newVersion,
			name: versionName,
			description: versionDescription,
		});
		await dbRun(sqlNewVersion[0], sqlNewVersion[1]);
		returningPersona.version = newVersion;
		returningPersona.name = versionName;
		returningPersona.description = versionDescription;

		const sqlUpdatePersona = update(
			'persona',
			{ current_version_id: newVersionId, updated: new Date().getTime() },
			{ id }
		);
		[persona] = (await dbRun(
			sqlUpdatePersona[0],
			sqlUpdatePersona[1]
		)) as PersonaVersionMerged[];
	}

	const sqlUpdatePersona = update(
		'persona',
		{
			updated: new Date().getTime(),
			profile_pic,
			profile_pic_prompt,
			profile_pic_use_prompt,
		},
		{ id }
	);
	[persona] = (await dbRun(
		sqlUpdatePersona[0],
		sqlUpdatePersona[1]
	)) as PersonaVersionMerged[];
	if (!returningPersona) {
		returningPersona = { ...persona };
		returningPersona.version = currentVersion.version;
		returningPersona.name = currentVersion.name;
		returningPersona.description = currentVersion.description;
	}
	returningPersona.profile_pic = persona.profile_pic;
	returningPersona.profile_pic_prompt = persona.profile_pic_prompt;
	returningPersona.profile_pic_use_prompt = persona.profile_pic_use_prompt;

	return returningPersona;
}