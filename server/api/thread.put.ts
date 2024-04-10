import { getDB } from '../database/knex';

// Update Existing Thread

interface DataShape {
	id: number;
	name?: string;
	persona_id?: number;
	mode?: 'persona' | 'custom';
}

export default defineEventHandler(async (event) => {
	const data = (await readBody(event)) as DataShape;
	const { id, name, persona_id, mode } = data;

	const db = await getDB();
	const [thread] = await db('chat_thread')
		.where({ id })
		.update({
			name,
			persona_id,
			mode,
		})
		.returning('*');

	return thread;
});
