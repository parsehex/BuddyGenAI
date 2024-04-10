import z from 'zod';
import { getDB } from '../database/knex';

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

	const db = await getDB();
	const [thread] = await db('persona')
		.insert({
			created: new Date(),
			name,
			description,
			profile_pic,
			profile_pic_prompt,
			profile_pic_use_prompt,
		})
		.returning('*');

	return thread;
});
