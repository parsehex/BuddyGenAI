import { v4 as uuidv4 } from 'uuid';
import type {
	ChatThread,
	BuddyVersionMerged,
	Buddy,
	BuddyVersion,
} from '@/types/db';
import { insert, select, update } from '@//sql';
import type { UpdateBuddyOptions } from '@/types/api';
import { all, get, run } from '@/modules/db';
import { AppSettings } from '@/AppSettings';
import { fromPersonaDescription } from '@/shared/ai/prompts/buddy';
import { defaultAIChatPrompt } from '@/shared/ai/prompts/chat';

interface CreateThreadOptions {
	name: string;
	persona_id?: string;
	mode: 'persona' | 'custom';
}

export async function createThread({
	name,
	persona_id,
	mode,
}: CreateThreadOptions): Promise<ChatThread> {
	const sqlThread = select('chat_thread', ['id'], { name });
	const existingThread = (await get(sqlThread[0], sqlThread[1])) as ChatThread;
	if (existingThread) {
		const hasExt = name.match(/ - \d+$/);
		if (hasExt) {
			name = name.replace(/ - \d+$/, ` - ${parseInt(hasExt[0].slice(3)) + 1}`);
		} else {
			name += ' - 1';
		}
	}

	let current_persona_version_id = null;
	if (mode === 'persona') {
		if (!persona_id) {
			throw new Error('Buddy ID is required');
		}
		const sqlBuddy = select('persona', ['current_version_id'], {
			id: persona_id,
		});
		const buddy = (await get(sqlBuddy[0], sqlBuddy[1])) as Buddy;
		if (!buddy) {
			throw new Error('Buddy not found');
		}
		current_persona_version_id = buddy.current_version_id;
	}

	const id = uuidv4();
	const sqlInsert = insert('chat_thread', {
		id,
		created: new Date().getTime(),
		name,
		persona_id,
		current_persona_version_id,
		mode,
		persona_mode_use_current: true,
	});
	await run(sqlInsert[0], sqlInsert[1]);
	const sqlThread2 = select('chat_thread', ['*'], { id });
	const thread = (await get(sqlThread2[0], sqlThread2[1])) as ChatThread;
	const userName = (await AppSettings.get('user_name')) as string;

	const chatImages = (await AppSettings.get('chat_image_enabled')) as
		| string
		| number;
	const chatImagesEnabled =
		!!chatImages && chatImages !== '0.0' && chatImages !== 0;

	if (mode === 'custom') {
		const sqlMessage = insert('chat_message', {
			id: uuidv4(),
			created: new Date().getTime(),
			role: 'system',
			content: defaultAIChatPrompt(userName, chatImagesEnabled),
			image: '',
			tts: '',
			thread_id: thread.id,
			thread_index: 0,
		});
		await run(sqlMessage[0], sqlMessage[1]);
	} else if (mode === 'persona') {
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
				image: '',
				tts: '',
				thread_id: thread.id,
				thread_index: 0,
			});
			await run(sqlMessage[0], sqlMessage[1]);
		}
	}

	return thread;
}
