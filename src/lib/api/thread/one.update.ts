import { v4 as uuidv4 } from 'uuid';
import { AppSettings } from '@/lib/api/AppSettings';
import type { ChatThread, Buddy, BuddyVersion } from '@/lib/api/types-db';
import * as prompt from '@/lib/prompt/persona';
import { del, insert, select, update } from '@/lib/sql';
import useElectron from '@/composables/useElectron';

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

	const userName = AppSettings.get('user_name') as string;

	const changedName = name && name !== currentThread.name;
	const changedMode = mode && mode !== currentThread.mode;
	const changedBuddy = persona_id && persona_id !== currentThread.persona_id;

	const dataToUpdate: Record<string, any> = {};
	if (changedName) dataToUpdate.name = name;
	if (changedMode) dataToUpdate.mode = mode;
	if (changedBuddy) dataToUpdate.persona_id = persona_id;
	if (persona_mode_use_current) dataToUpdate.persona_id = null;

	const sqlUpdateThread = update('chat_thread', dataToUpdate, { id });
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
			const buddyId = (persona_id || currentThread.persona_id) as string;
			const sqlBuddy = select('persona', ['*'], { id: buddyId });
			const buddy = (await dbGet(sqlBuddy[0], sqlBuddy[1])) as Buddy;
			if (buddy) {
				const sqlBuddyVersion = select('persona_version', ['*'], {
					id: buddy.current_version_id,
				});
				const buddyVersion = (await dbGet(
					sqlBuddyVersion[0],
					sqlBuddyVersion[1]
				)) as BuddyVersion;
				if (!buddyVersion) {
					throw new Error('Current version of Buddy not found');
				}
				const sqlMessage = insert('chat_message', {
					id: uuidv4(),
					created: new Date().getTime(),
					role: 'system',
					content: prompt.fromPersonaDescription(
						userName,
						buddyVersion.name,
						buddyVersion.description || ''
					),
					thread_id: id,
					thread_index: 0,
				});
				await dbRun(sqlMessage[0], sqlMessage[1]);
			} else {
				console.error(`Buddy ID-${buddyId} not found (was it deleted?)`);
			}
		}
	}

	if (changedBuddy) {
		const sqlMessages = del('chat_message', { thread_id: id });
		await dbRun(sqlMessages[0], sqlMessages[1]);

		const sqlBuddy = select('persona', ['*'], { id: persona_id });
		const buddy = (await dbGet(sqlBuddy[0], sqlBuddy[1])) as Buddy;
		if (buddy) {
			const sqlBuddyVersion = select('persona_version', ['*'], {
				id: buddy.current_version_id,
			});
			const buddyVersion = (await dbGet(
				sqlBuddyVersion[0],
				sqlBuddyVersion[1]
			)) as BuddyVersion;
			if (!buddyVersion) {
				throw new Error('Current version of Buddy not found');
			}
			const sqlMessage = insert('chat_message', {
				id: uuidv4(),
				created: new Date().getTime(),
				role: 'system',
				content: prompt.fromPersonaDescription(
					userName,
					buddyVersion.name,
					buddyVersion.description || ''
				),
				thread_id: id,
				thread_index: 0,
			});
			await dbRun(sqlMessage[0], sqlMessage[1]);
		} else {
			console.error(`Buddy ID-${persona_id} not found (was it deleted?)`);
		}
	}

	return thread;
}
