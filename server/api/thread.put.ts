import z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { promptFromPersonaDescription } from '~/lib/prompt/persona';
import { getDB } from '../database/knex';
import type { Persona } from '../database/types';

// Update Existing Thread

const bodySchema = z.object({
	id: z.string(),
	name: z.string().optional(),
	persona_id: z.string().optional(),
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
				id: uuidv4(),
				created: new Date().getTime(),
				role: 'system',
				content: 'The following is a chat between a human User and an embodied AI Assistant.',
				thread_id: id,
				thread_index: 0,
			});
		} else if (mode === 'persona') {
			const personaId = (persona_id || currentThread.persona_id) as string;
			const persona = (await db('persona').where({ id: personaId }).first()) as Persona;
			if (persona) {
				await db('chat_message').insert({
					id: uuidv4(),
					created: new Date().getTime(),
					role: 'system',
					content: promptFromPersonaDescription(persona.name, persona.description || ''),
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
			await db('chat_message').insert({
				created: new Date().getTime(),
				role: 'system',
				content: promptFromPersonaDescription(persona.name, persona.description || ''),
				thread_id: id,
				thread_index: 0,
			});
		} else {
			console.error(`Persona ID-${persona_id} not found (was it deleted?)`);
		}
	}

	return thread;
});
