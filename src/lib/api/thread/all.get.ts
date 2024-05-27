import type {
	ChatMessage,
	ChatThread,
	MergedChatThread,
	Buddy,
	BuddyVersion,
} from '@/lib/api/types-db';
import { select } from '@/lib/sql';
import useElectron from '@/composables/useElectron';

const { dbAll, dbGet } = useElectron();

export default async function getAll(
	buddy_id?: string
): Promise<MergedChatThread[]> {
	if (!dbAll) throw new Error('dbAll is not defined');

	if (buddy_id) {
		const sql = select('chat_thread', ['*'], { persona_id: buddy_id });
		const threads = (await dbAll(sql[0], sql[1])) as ChatThread[];

		const threadsMessages = await Promise.all(
			threads.map((thread) => {
				const sql = select('chat_message', ['*'], { thread_id: thread.id });
				return dbAll(sql[0], sql[1]) as Promise<ChatMessage[]>;
			})
		);

		const sqlBuddy = select('persona', ['*'], { id: buddy_id });
		const buddy = (await dbGet(sqlBuddy[0], sqlBuddy[1])) as Buddy;

		const sqlBuddyVersion = select('persona_version', ['*'], {
			id: buddy.current_version_id,
		});
		const buddyVersion = (await dbGet(
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
		const threads = (await dbAll(sql[0], sql[1])) as ChatThread[];

		const threadsMessages = await Promise.all(
			threads.map((thread) => {
				const sql = select('chat_message', ['*'], { thread_id: thread.id });
				return dbAll(sql[0], sql[1]) as Promise<ChatMessage[]>;
			})
		);

		const buddies = await Promise.all(
			threads.map((thread) => {
				const sqlBuddy = select('persona', ['*'], { id: thread.persona_id });
				const buddy = dbGet(sqlBuddy[0], sqlBuddy[1]);
				const sqlBuddyVersion = select('persona_version', ['*'], {
					id: thread.current_persona_version_id,
				});
				const buddyVersion = dbGet(sqlBuddyVersion[0], sqlBuddyVersion[1]);
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
