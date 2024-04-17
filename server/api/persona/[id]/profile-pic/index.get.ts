import z from 'zod';
import path from 'path';
import fs from 'fs/promises';
import { getDB, getDataPath } from '~/server/database/knex';
import { getDirname } from '~/lib/fs';

const urlSchema = z.object({
	id: z.string(),
	cache: z.string().optional(),
});

export default defineEventHandler(async (event) => {
	const { id: persona_id } = await getValidatedRouterParams(event, (params) => urlSchema.parse(params));

	const db = await getDB();
	const persona = await db('persona').where({ id: persona_id }).first();

	if (!persona) {
		throw new Error('Persona not found');
	}

	const dataPath = getDataPath();
	let imagePath = path.join(dataPath, `images/${persona.id}.png`);

	if (process.env.NODE_ENV === 'development') {
		// TODO overhaul paths
		imagePath = path.resolve(await getDirname(), '../..', imagePath);
	}

	try {
		const image = await fs.readFile(imagePath);
		return image;
	} catch (error) {
		throw createError({
			statusCode: 404,
			message: 'Profile picture not found',
		});
	}
});
