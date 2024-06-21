import { v4 as uuidv4 } from 'uuid';
import type {
	ChatThread,
	BuddyVersionMerged,
	Buddy,
	BuddyVersion,
} from '@/types/db';
import { del, insert, select, update } from '@//sql';
import { all, get, run } from '@/modules/db';
import { AppSettings } from '@/AppSettings';
import { fromPersonaDescription } from '@/shared/ai/prompts/buddy';

interface UpdateThreadOptions {
	name?: string;
	persona_id?: string;
	mode?: 'persona' | 'custom';
	persona_mode_use_current?: boolean;
}

export async function updateThread(
	id: string,
	{ name, persona_id, mode, persona_mode_use_current }: UpdateThreadOptions
): Promise<ChatThread> {
	const sqlThread = select('chat_thread', ['*'], { id });
	const currentThread = (await get(sqlThread[0], sqlThread[1])) as ChatThread;
	if (!currentThread) {
		throw new Error('Thread not found');
	}

	const userName = (await AppSettings.get('user_name')) as string;

	const changedName = name && name !== currentThread.name;
	const changedMode = mode && mode !== currentThread.mode;
	const changedBuddy = persona_id && persona_id !== currentThread.persona_id;

	const dataToUpdate: Record<string, any> = {};
	if (changedName) dataToUpdate.name = name;
	if (changedMode) dataToUpdate.mode = mode;
	if (changedBuddy) dataToUpdate.persona_id = persona_id;
	if (persona_mode_use_current) dataToUpdate.persona_id = null;

	const sqlUpdateThread = update('chat_thread', dataToUpdate, { id });
	await run(sqlUpdateThread[0], sqlUpdateThread[1]);
	const sqlThreadGet = select('chat_thread', ['*'], { id });
	const thread = (await get(sqlThreadGet[0], sqlThreadGet[1])) as ChatThread;

	const chatImages = (await AppSettings.get('chat_image_enabled')) as
		| string
		| number;
	const chatImagesEnabled =
		!!chatImages && chatImages !== '0.0' && chatImages !== 0;

	if (changedMode) {
		const sqlMessages = del('chat_message', { thread_id: id });
		await run(sqlMessages[0], sqlMessages[1]);
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
			await run(sqlMessage[0], sqlMessage[1]);
		} else if (mode === 'persona') {
			const buddyId = (persona_id || currentThread.persona_id) as string;
			const sqlBuddy = select('persona', ['*'], { id: buddyId });
			const buddy = (await get(sqlBuddy[0], sqlBuddy[1])) as Buddy;
			if (buddy) {
				const sqlBuddyVersion = select('persona_version', ['*'], {
					id: buddy.current_version_id,
				});
				const buddyVersion = (await get(
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
					content: fromPersonaDescription(
						userName,
						buddyVersion.name,
						buddyVersion.description || '',
						chatImagesEnabled
					),
					thread_id: id,
					thread_index: 0,
				});
				await run(sqlMessage[0], sqlMessage[1]);
			} else {
				console.error(`Buddy ID-${buddyId} not found (was it deleted?)`);
			}
		}
	}

	if (changedBuddy) {
		const sqlMessages = del('chat_message', { thread_id: id });
		await run(sqlMessages[0], sqlMessages[1]);

		const sqlBuddy = select('persona', ['*'], { id: persona_id });
		const buddy = (await get(sqlBuddy[0], sqlBuddy[1])) as Buddy;
		if (buddy) {
			const sqlBuddyVersion = select('persona_version', ['*'], {
				id: buddy.current_version_id,
			});
			const buddyVersion = (await get(
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
				content: fromPersonaDescription(
					userName,
					buddyVersion.name,
					buddyVersion.description || '',
					chatImagesEnabled
				),
				thread_id: id,
				thread_index: 0,
			});
			await run(sqlMessage[0], sqlMessage[1]);
		} else {
			console.error(`Buddy ID-${persona_id} not found (was it deleted?)`);
		}
	}

	return thread;
}
