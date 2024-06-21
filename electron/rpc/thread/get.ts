import { v4 as uuidv4 } from 'uuid';
import type {
	ChatThread,
	BuddyVersionMerged,
	ChatMessage,
	Buddy,
	BuddyVersion,
} from '@/types/db';
import { insert, select, update } from '@//sql';
import type { UpdateBuddyOptions } from '@/types/api';
import { all, get, run } from '@/modules/db';

export async function getAllThreads(buddyId?: string): Promise<ChatThread[]> {
	if (buddyId) {
		const sql = select('chat_thread', ['*'], { persona_id: buddyId });
		const threads = (await all(sql[0], sql[1])) as ChatThread[];

		const threadsMessages = await Promise.all(
			threads.map((thread) => {
				const sql = select('chat_message', ['*'], { thread_id: thread.id });
				return all(sql[0], sql[1]) as Promise<ChatMessage[]>;
			})
		);

		const sqlBuddy = select('persona', ['*'], { id: buddyId });
		const buddy = (await get(sqlBuddy[0], sqlBuddy[1])) as Buddy;

		const sqlBuddyVersion = select('persona_version', ['*'], {
			id: buddy.current_version_id,
		});
		const buddyVersion = (await get(
			sqlBuddyVersion[0],
			sqlBuddyVersion[1]
		)) as BuddyVersion;

		const mergedThreads = threads.map((thread, i) => {
			const threadMessages = threadsMessages[i];
			return {
				...thread,
				latest_message: threadMessages[threadMessages.length - 1],
				selected_buddy: {
					...buddy,
					name: buddyVersion.name,
					description: buddyVersion.description,
					persona_id: buddy.id,
					version: buddyVersion.version,
				},
			};
		});
		mergedThreads.sort((a, b) => {
			if (!a.latest_message || !b.latest_message) {
				return 0;
			}
			return b.latest_message.created - a.latest_message.created;
		});
		return mergedThreads;
	} else {
		const sql = select('chat_thread', ['*']);
		const threads = (await all(sql[0], sql[1])) as ChatThread[];

		const threadsMessages = await Promise.all(
			threads.map((thread) => {
				const sql = select('chat_message', ['*'], { thread_id: thread.id });
				return all(sql[0], sql[1]) as Promise<ChatMessage[]>;
			})
		);

		const buddies = await Promise.all(
			threads.map((thread) => {
				const sqlBuddy = select('persona', ['*'], { id: thread.persona_id });
				const buddy = get(sqlBuddy[0], sqlBuddy[1]);
				const sqlBuddyVersion = select('persona_version', ['*'], {
					id: thread.current_persona_version_id,
				});
				const buddyVersion = get(sqlBuddyVersion[0], sqlBuddyVersion[1]);
				return Promise.all([buddy, buddyVersion]) as Promise<[Buddy, BuddyVersion]>;
			})
		);

		console.log(threadsMessages);

		const mergedThreads = threads.map((thread, i) => {
			const buddy = buddies[i][0];
			const buddyVersion = buddies[i][1];
			const threadMessages = threadsMessages[i];
			return {
				...thread,
				latest_message: threadMessages[threadMessages.length - 1],
				selected_buddy: buddy
					? {
							...buddy,
							name: buddyVersion.name,
							description: buddyVersion.description,
							persona_id: buddy.id,
							version: buddyVersion.version,
					  }
					: null,
			};
		});

		mergedThreads.sort((a, b) => {
			if (!a.latest_message || !b.latest_message) {
				return 0;
			}
			return b.latest_message.created - a.latest_message.created;
		});

		return mergedThreads;
	}
}

export async function getThread(threadId: string): Promise<ChatThread> {
	const sql = select('chat_thread', ['*'], { id: threadId });
	const thread = (await get(sql[0], sql[1])) as ChatThread;
	if (!thread) {
		throw new Error('Thread not found');
	}
	return thread;
}
