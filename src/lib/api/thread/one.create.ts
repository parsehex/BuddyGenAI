import { v4 as uuidv4 } from 'uuid';
import { AppSettings } from '@/lib/api/AppSettings';
import type { ChatThread, Buddy, BuddyVersion } from '@/lib/api/types-db';
import useElectron from '@/composables/useElectron';
import * as prompt from '@/src/lib/prompt/buddy';
import { insert, select } from '@/lib/sql';
import { defaultAIChatPrompt } from '../../prompt/chat';

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

	let current_persona_version_id = null;
	if (mode === 'persona') {
		if (!persona_id) {
			throw new Error('Buddy ID is required');
		}
		const sqlBuddy = select('persona', ['current_version_id'], {
			id: persona_id,
		});
		const buddy = (await dbGet(sqlBuddy[0], sqlBuddy[1])) as Buddy;
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
	await dbRun(sqlInsert[0], sqlInsert[1]);
	const sqlThread2 = select('chat_thread', ['*'], { id });
	const thread = (await dbGet(sqlThread2[0], sqlThread2[1])) as ChatThread;
	const userName = AppSettings.get('user_name') as string;

	if (mode === 'custom') {
		const sqlMessage = insert('chat_message', {
			id: uuidv4(),
			created: new Date().getTime(),
			role: 'system',
			content: defaultAIChatPrompt(userName),
			image: '',
			tts: '',
			thread_id: thread.id,
			thread_index: 0,
		});
		await dbRun(sqlMessage[0], sqlMessage[1]);
	} else if (mode === 'persona') {
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
				image: '',
				tts: '',
				thread_id: thread.id,
				thread_index: 0,
			});
			await dbRun(sqlMessage[0], sqlMessage[1]);
		}
	}

	return thread;
}
