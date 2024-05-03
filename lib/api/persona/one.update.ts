import { v4 as uuidv4 } from 'uuid';
import type { ChatThread, BuddyVersionMerged } from '@/lib/api/types-db';
import { insert, select, update } from '@/lib/sql';

const { dbGet, dbAll, dbRun } = useElectron();

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
}: UpdatePersonaOptions): Promise<BuddyVersionMerged> {
	if (!dbGet || !dbRun) throw new Error('dbGet or dbRun is not defined');
	if (!id) {
		throw new Error('Persona ID is required');
	}

	let returningPersona: BuddyVersionMerged = null as any;

	const sqlPersona = select('persona', ['*'], { id });
	let persona = (await dbGet(
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
		await dbRun(sqlUpdatePersona[0], sqlUpdatePersona[1]);
		const sqlPersonaGet = select('persona', ['*'], { id });
		persona = (await dbGet(
			sqlPersonaGet[0],
			sqlPersonaGet[1]
		)) as BuddyVersionMerged;

		const sqlThreads = select('chat_thread', ['*'], {
			persona_id: id,
			persona_mode_use_current: true,
		});
		const threads = (await dbAll(sqlThreads[0], sqlThreads[1])) as ChatThread[];
		if (threads.length) {
			const sqlUpdateThreads = threads.map((thread) => {
				return update(
					'chat_thread',
					{ current_persona_version_id: newVersionId },
					{ id: thread.id }
				);
			});
			await Promise.all(sqlUpdateThreads.map((sql) => dbRun(sql[0], sql[1])));
		}
	}

	const dataToUpdate: Record<string, any> = {
		updated: new Date().getTime(),
	};
	if (profile_pic) dataToUpdate.profile_pic = profile_pic;
	if (profile_pic_prompt) dataToUpdate.profile_pic_prompt = profile_pic_prompt;
	if (profile_pic_use_prompt)
		dataToUpdate.profile_pic_use_prompt = profile_pic_use_prompt;

	if (Object.keys(dataToUpdate).length === 1) {
		return returningPersona;
	}
	const sqlUpdatePersona = update('persona', dataToUpdate, { id });
	await dbRun(sqlUpdatePersona[0], sqlUpdatePersona[1]);
	const sqlPersonaGet = select('persona', ['*'], { id });
	persona = (await dbGet(
		sqlPersonaGet[0],
		sqlPersonaGet[1]
	)) as BuddyVersionMerged;
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
