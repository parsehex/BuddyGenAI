import z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import AppSettings from '~/server/AppSettings';
import { getDB } from '~/server/database/knex';
import type { Persona } from '~/server/database/types';
import * as prompt from '~/lib/prompt/persona';

const bodySchema = z.object({
	name: z.string(),
	persona_id: z.string().optional(),
	mode: z.literal('persona').or(z.literal('custom')),
});

export default defineEventHandler(async (event) => {
	const data = await readValidatedBody(event, (body) => bodySchema.parse(body));
	let { name } = data;
	const { persona_id, mode } = data;
	const db = await getDB();

	// check for a thread with the same name (add an ext with number if exists)
	// theres a unique constraint on the name column
	const [existingThread] = await db('chat_thread').where({ name }).select('id');
	if (existingThread) {
		const hasExt = name.match(/ - \d+$/);
		if (hasExt) {
			name = name.replace(/ - \d+$/, ` - ${parseInt(hasExt[0].slice(3)) + 1}`);
		} else {
			name += ' - 1';
		}
	}

	const [thread] = await db('chat_thread')
		.insert({
			id: uuidv4(),
			created: new Date().getTime(),
			name,
			persona_id,
			mode,
			persona_mode_use_current: true,
		})
		.returning('*');

	if (mode === 'custom') {
		await db('chat_message').insert({
			id: uuidv4(),
			created: new Date().getTime(),
			role: 'system',
			content: 'The following is a chat between a human User and an embodied AI Assistant.',
			thread_id: thread.id,
			thread_index: 0,
		});
	} else if (mode === 'persona') {
		const persona = (await db('persona').where({ id: persona_id }).first()) as Persona;
		if (persona) {
			const personaVersion = await db('persona_version').where({ id: persona.current_version_id }).first();
			if (!personaVersion) {
				throw new Error('Current version of persona not found');
			}
			const userName = AppSettings.get('user_name');
			await db('chat_message').insert({
				id: uuidv4(),
				created: new Date().getTime(),
				role: 'system',
				content: prompt.fromPersonaDescription(userName, personaVersion.name, personaVersion.description || ''),
				thread_id: thread.id,
				thread_index: 0,
			});
		} else {
			console.error(`Persona ID-${persona_id} not found (was it deleted?)`);
		}
	}

	return thread;
});
