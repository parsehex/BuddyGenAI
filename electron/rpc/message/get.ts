import type {
	Buddy,
	BuddyVersion,
	BuddyVersionMerged,
	ChatMessage,
	ChatThread,
} from '@/types/db';
import { select } from '@/sql';
import { all, get } from '@/modules/db';
import { AppSettings } from '@/AppSettings';
import * as prompt from '@/shared/ai/prompts/buddy';

export async function getAllMessages(threadId: string): Promise<ChatMessage[]> {
	const sqlThread = select('chat_thread', ['*'], { id: threadId });
	const thread = (await get(sqlThread[0], sqlThread[1])) as ChatThread;

	const shouldReplaceSystem =
		thread.mode === 'persona' && thread.persona_mode_use_current;

	const sqlMessages = select('chat_message', ['*'], { thread_id: threadId });
	const messages = (await all(sqlMessages[0], sqlMessages[1])) as ChatMessage[];
	const hasSystemMessage = messages[0]?.role === 'system';

	if (shouldReplaceSystem && thread.persona_id) {
		const sqlBuddy = select('persona', ['*'], { id: thread.persona_id });
		const buddy = (await get(sqlBuddy[0], sqlBuddy[1])) as Buddy;
		if (!buddy) {
			throw new Error('Buddy not found');
		}

		const sqlBuddyVersion = select('persona_version', ['*'], {
			id: buddy.current_version_id,
		});
		const buddyVersion = (await get(
			sqlBuddyVersion[0],
			sqlBuddyVersion[1]
		)) as BuddyVersion;
		if (!buddyVersion) {
			throw new Error('Buddy version not found');
		}

		const chatImages = (await AppSettings.get('chat_image_enabled')) as
			| string
			| number;
		const chatImagesEnabled =
			!!chatImages && chatImages !== '0.0' && chatImages !== 0;

		if (!hasSystemMessage) {
			const userName = (await AppSettings.get('user_name')) as string;
			messages.unshift({
				id: '',
				created: new Date().getTime(),
				updated: new Date().getTime(),
				role: 'system',
				content: prompt.fromPersonaDescription(
					userName,
					buddyVersion.name,
					buddyVersion.description,
					chatImagesEnabled
				),
				image: null,
				tts: null,
				thread_id: threadId,
				thread_index: 0,
			});
		} else {
			const userName = (await AppSettings.get('user_name')) as string;
			messages[0].content = prompt.fromPersonaDescription(
				userName,
				buddyVersion.name,
				buddyVersion.description,
				chatImagesEnabled
			);
		}
	}

	// log whether last message has tts
	// console.log(messages[messages.length - 1].tts);

	return messages || [];
}
