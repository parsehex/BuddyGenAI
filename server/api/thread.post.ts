import { getDB } from '../database/knex';

// Create New Thread

interface DataShape {
	name: string;
	persona_id?: number;
	mode: 'persona' | 'custom';
}

export default defineEventHandler(async (event) => {
	const data = (await readBody(event)) as DataShape;
	const { name, persona_id, mode } = data;

	const db = await getDB();
	const [thread] = await db('chat_thread')
		.insert({
			created: new Date(),
			name,
			persona_id,
			mode
		})
		.returning('*');

	return thread;
});
