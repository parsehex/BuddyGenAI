import { v4 as uuidv4 } from 'uuid';
import AppSettings from '../../AppSettings';
import type { ChatThread, Persona, PersonaVersion } from '@/lib/api/types-db';

import * as prompt from '@/lib/prompt/persona';
import { insert, select } from '@/lib/sql';

const { dbGet, dbRun } = useElectron();

interface CreateThreadOptions {
	name: string;
	persona_id?: string;
	mode: 'persona' | 'custom';
}

export default async function createOne({
	name,
	persona_id,
	mode,
}: CreateThreadOptions): Promise<ChatThread> {
	if (!dbGet || !dbRun) throw new Error('dbGet or dbRun is not defined');

	if (!name) {
		throw new Error('Name is required');
	}

	const sqlThread = select('chat_thread', ['id'], { name });
	const existingThread = (await dbGet(sqlThread[0], sqlThread[1])) as ChatThread;
	if (existingThread) {
		const hasExt = name.match(/ - \d+$/);
		if (hasExt) {
			name = name.replace(/ - \d+$/, ` - ${parseInt(hasExt[0].slice(3)) + 1}`);
		} else {
			name += ' - 1';
		}
	}

	const id = uuidv4();
	const sqlInsert = insert('chat_thread', {
		id,
		created: new Date().getTime(),
		name,
		persona_id,
		mode,
		persona_mode_use_current: true,
	});
	await dbRun(sqlInsert[0], sqlInsert[1]);
	const sqlThread2 = select('chat_thread', ['*'], { id });
	const thread = (await dbGet(sqlThread2[0], sqlThread2[1])) as ChatThread;

	if (mode === 'custom') {
		const sqlMessage = insert('chat_message', {
			id: uuidv4(),
			created: new Date().getTime(),
			role: 'system',
			content:
				'The following is a chat between a human User and an embodied AI Assistant.',
			thread_id: thread.id,
			thread_index: 0,
		});
		await dbRun(sqlMessage[0], sqlMessage[1]);
	} else if (mode === 'persona') {
		const sqlPersona = select('persona', ['*'], { id: persona_id });
		const persona = (await dbGet(sqlPersona[0], sqlPersona[1])) as Persona;
		if (persona) {
			const sqlPersonaVersion = select('persona_version', ['*'], {
				id: persona.current_version_id,
			});
			const personaVersion = (await dbGet(
				sqlPersonaVersion[0],
				sqlPersonaVersion[1]
			)) as PersonaVersion;
			if (!personaVersion) {
				throw new Error('Current version of persona not found');
			}
			const userName = AppSettings.get('user_name');
			const sqlMessage = insert('chat_message', {
				id: uuidv4(),
				created: new Date().getTime(),
				role: 'system',
				content: prompt.fromPersonaDescription(
					userName,
					personaVersion.name,
					personaVersion.description || ''
				),
				thread_id: thread.id,
				thread_index: 0,
			});
			await dbRun(sqlMessage[0], sqlMessage[1]);
		}
	}

	return thread;
}
