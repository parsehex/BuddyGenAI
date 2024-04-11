import { getDB } from '../database/knex';
import type { Persona } from '../database/knex.d';
import z from 'zod';

// Update Existing Thread

const bodySchema = z.object({
	id: z.number(),
	name: z.string().optional(),
	persona_id: z.number().optional(),
	mode: z.literal('persona').or(z.literal('custom')).optional(),
});

export default defineEventHandler(async (event) => {
	const data = await readValidatedBody(event, (body) => bodySchema.parse(body));
	const { id, name, persona_id, mode } = data;

	const db = await getDB();
	const currentThread = await db('chat_thread').where({ id }).first();

	if (!currentThread) {
		throw new Error('Thread not found');
	}

	const [thread] = await db('chat_thread')
		.where({ id })
		.update({
			name,
			persona_id,
			mode,
		})
		.returning('*');

	const changedMode = mode && mode !== currentThread.mode;
	if (changedMode) {
		console.log('Mode changed, deleting first message');
		await db('chat_message').where({ thread_id: id }).delete();
		if (mode === 'custom') {
			await db('chat_message').insert({
				created: new Date().getTime(),
				role: 'system',
				content: 'The following is a chat between a human User and an embodied AI Assistant.',
				thread_id: id,
				thread_index: 0,
			});
		} else if (mode === 'persona') {
			// use persona's description for the system message
			const personaId = (persona_id || currentThread.persona_id) as number;
			const persona = (await db('persona').where({ id: personaId }).first()) as Persona;
			if (persona) {
				// TODO make this a function
				const prompt = `
The following is a chat between a human User and an Assistant playing the role of ${persona.name}. Description of ${persona.name} that Assistant follows faithfully:\n${persona.description}`;
				await db('chat_message').insert({
					created: new Date().getTime(),
					role: 'system',
					content: prompt.trim(),
					thread_id: id,
					thread_index: 0,
				});
			} else {
				console.error(`Persona ID-${personaId} not found (was it deleted?)`);
			}
		}
	}

	const changedPersona = persona_id && persona_id !== currentThread.persona_id;
	if (changedPersona) {
		console.log('Persona changed, deleting first message');
		await db('chat_message').where({ thread_id: id }).delete();
		const persona = await db('persona').where({ id: persona_id }).first();
		if (persona) {
			const prompt = `
The following is a chat between a human User and an Assistant playing the role of ${persona.name}. Description of ${persona.name} that Assistant follows faithfully:\n${persona.description}`;
			await db('chat_message').insert({
				created: new Date().getTime(),
				role: 'system',
				content: prompt.trim(),
				thread_id: id,
				thread_index: 0,
			});
		} else {
			console.error(`Persona ID-${persona_id} not found (was it deleted?)`);
		}
	}

	return thread;
});
