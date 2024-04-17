import z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '~/server/database/knex';
import type { PersonaVersionMerged } from '~/server/database/types';

// Update persona

const urlSchema = z.object({
	id: z.string(),
});
const bodySchema = z.object({
	name: z.string().optional(),
	description: z.string().optional(),
	profile_pic: z.string().optional(),
	profile_pic_prompt: z.string().optional(),
	profile_pic_use_prompt: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
	const { id } = await getValidatedRouterParams(event, (params) => urlSchema.parse(params));
	const data = await readValidatedBody(event, (body) => bodySchema.parse(body));
	let { name, description, profile_pic, profile_pic_prompt, profile_pic_use_prompt } = data;

	if (!id) {
		throw new Error('Persona ID is required');
	}

	let returningPersona: PersonaVersionMerged = null as any;

	const db = await getDB();

	let persona: any;
	persona = await db('persona').where({ id }).first();
	if (!persona) {
		throw new Error('Persona not found');
	}
	const currentVersion = await db('persona_version').where({ id: persona.current_version_id }).first();
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
		await db('persona_version').insert({
			id: newVersionId,
			created: new Date().getTime(),
			persona_id: id,
			version: newVersion,
			name: versionName,
			description: versionDescription,
		});
		returningPersona.version = newVersion;
		returningPersona.name = versionName;
		returningPersona.description = versionDescription;

		[persona] = await db('persona')
			.where({ id })
			.update({
				current_version_id: newVersionId,
				updated: new Date().getTime(),
			})
			.returning('*');
	}

	[persona] = await db('persona')
		.where({ id })
		.update({
			updated: new Date().getTime(),
			profile_pic,
			profile_pic_prompt,
			profile_pic_use_prompt,
		})
		.returning('*');
	if (!returningPersona) {
		returningPersona = { ...persona };
		returningPersona.version = currentVersion.version;
		returningPersona.name = currentVersion.name;
		returningPersona.description = currentVersion.description;
	}
	returningPersona.profile_pic = persona.profile_pic;
	returningPersona.profile_pic_prompt = persona.profile_pic_prompt;
	returningPersona.profile_pic_use_prompt = persona.profile_pic_use_prompt;

	return persona;
});
