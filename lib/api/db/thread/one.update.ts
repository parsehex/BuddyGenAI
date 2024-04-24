import { v4 as uuidv4 } from 'uuid';
import AppSettings from '../../AppSettings';
import type { ChatThread, Persona, PersonaVersion } from '@/lib/api/types-db';
import * as prompt from '@/lib/prompt/persona';
import { del, insert, select, update } from '@/lib/sql';

const { dbGet, dbRun } = useElectron();

interface UpdateThreadOptions {
	name?: string;
	persona_id?: string;
	mode?: 'persona' | 'custom';
	persona_mode_use_current?: boolean;
}

export default async function updateOne(
	id: string,
	{ name, persona_id, mode, persona_mode_use_current }: UpdateThreadOptions
): Promise<ChatThread> {
	if (!dbGet || !dbRun) throw new Error('dbGet or dbRun is not defined');

	const sqlThread = select('chat_thread', ['*'], { id });
	const currentThread = (await dbGet(sqlThread[0], sqlThread[1])) as ChatThread;
	if (!currentThread) {
		throw new Error('Thread not found');
	}

	const userName = AppSettings.get('user_name');

	const changedMode = mode && mode !== currentThread.mode;
	const changedPersona = persona_id && persona_id !== currentThread.persona_id;

	const sqlUpdateThread = update(
		'chat_thread',
		{ name, persona_id, mode, persona_mode_use_current },
		{ id }
	);
	await dbRun(sqlUpdateThread[0], sqlUpdateThread[1]);
	const sqlThreadGet = select('chat_thread', ['*'], { id });
	const thread = (await dbGet(sqlThreadGet[0], sqlThreadGet[1])) as ChatThread;

	if (changedMode) {
		const sqlMessages = del('chat_message', { thread_id: id });
		await dbRun(sqlMessages[0], sqlMessages[1]);
		if (mode === 'custom') {
			const sqlMessage = insert('chat_message', {
				id: uuidv4(),
				created: new Date().getTime(),
				role: 'system',
				content:
					'The following is a chat between a human User and an embodied AI Assistant.',
				thread_id: id,
				thread_index: 0,
			});
			await dbRun(sqlMessage[0], sqlMessage[1]);
		} else if (mode === 'persona') {
			const personaId = (persona_id || currentThread.persona_id) as string;
			const sqlPersona = select('persona', ['*'], { id: personaId });
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
				const sqlMessage = insert('chat_message', {
					id: uuidv4(),
					created: new Date().getTime(),
					role: 'system',
					content: prompt.fromPersonaDescription(
						userName,
						personaVersion.name,
						personaVersion.description || ''
					),
					thread_id: id,
					thread_index: 0,
				});
				await dbRun(sqlMessage[0], sqlMessage[1]);
			} else {
				console.error(`Persona ID-${personaId} not found (was it deleted?)`);
			}
		}
	}

	if (changedPersona) {
		const sqlMessages = del('chat_message', { thread_id: id });
		await dbRun(sqlMessages[0], sqlMessages[1]);

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
			const sqlMessage = insert('chat_message', {
				id: uuidv4(),
				created: new Date().getTime(),
				role: 'system',
				content: prompt.fromPersonaDescription(
					userName,
					personaVersion.name,
					personaVersion.description || ''
				),
				thread_id: id,
				thread_index: 0,
			});
			await dbRun(sqlMessage[0], sqlMessage[1]);
		} else {
			console.error(`Persona ID-${persona_id} not found (was it deleted?)`);
		}
	}

	return thread;
}
