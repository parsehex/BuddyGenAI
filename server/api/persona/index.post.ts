import z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../../database/knex';
import type { PersonaVersionMerged } from '../../database/types';

// Create New Persona

const bodySchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	profile_pic: z.string().optional(),
	profile_pic_prompt: z.string().optional(),
	profile_pic_use_prompt: z.boolean().default(true),
});

export default defineEventHandler(async (event) => {
	const data = await readValidatedBody(event, (body) => bodySchema.parse(body));
	let { name, description, profile_pic, profile_pic_prompt, profile_pic_use_prompt } = data;

	if (!name) {
		throw new Error('Name is required');
	}

	const firstVersionId = uuidv4();
	const personaId = uuidv4();

	const db = await getDB();
	const [persona] = await db('persona')
		.insert({
			id: personaId,
			created: new Date().getTime(),
			current_version_id: firstVersionId,
			profile_pic,
			profile_pic_prompt,
			profile_pic_use_prompt,
		})
		.returning('*');

	await db('persona_version').insert({
		id: firstVersionId,
		created: new Date().getTime(),
		persona_id: personaId,
		version: 1,
		name,
		description,
	});

	return {
		...persona,
		name,
		description,
	} as PersonaVersionMerged;
});
