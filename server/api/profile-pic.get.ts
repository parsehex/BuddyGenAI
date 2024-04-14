import { getDB, getDataPath } from '../database/knex';
import z from 'zod';
import { getDirname } from '~/lib/fs';
import path from 'path';
import fs from 'fs/promises';

const querySchema = z.object({
	persona_id: z.string(),
});

export default defineEventHandler(async (event) => {
	const data = await getValidatedQuery(event, (body) => querySchema.parse(body));

	const db = await getDB();
	const persona = await db('persona').where({ id: data.persona_id }).first();

	if (!persona) {
		throw new Error('Persona not found');
	}

	const dataPath = getDataPath();
	let imagePath = path.join(dataPath, `images/${persona.id}.png`);

	if (process.env.NODE_ENV === 'development') {
		// TODO overhaul paths
		imagePath = path.resolve(await getDirname(), '../..', imagePath);
	}

	const image = await fs.readFile(imagePath);
	return image;
});
