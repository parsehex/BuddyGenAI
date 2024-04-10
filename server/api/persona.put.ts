import z from 'zod';
import { getDB } from '../database/knex';

// Update persona

const bodySchema = z.object({
	id: z.number(),
	name: z.string().optional(),
	description: z.string().optional(),
	profile_pic: z.string().optional(),
	profile_pic_prompt: z.string().optional(),
	profile_pic_use_prompt: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
	const data = await readValidatedBody(event, (body) => bodySchema.parse(body));
	let { id, name, description, profile_pic, profile_pic_prompt, profile_pic_use_prompt } = data;

	if (!id) {
		throw new Error('Persona ID is required');
	}

	const db = await getDB();
	const [thread] = await db('persona')
		.where({ id })
		.update({
			updated: new Date().getTime(),
			name,
			description,
			profile_pic,
			profile_pic_prompt,
			profile_pic_use_prompt,
		})
		.returning('*');

	return thread;
});
