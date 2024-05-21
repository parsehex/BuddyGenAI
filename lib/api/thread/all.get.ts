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
	persona_id?: string
): Promise<MergedChatThread[]> {
	if (!dbAll) throw new Error('dbAll is not defined');

	if (persona_id) {
		const sql = select('chat_thread', ['*'], { persona_id });
		const threads = (await dbAll(sql[0], sql[1])) as ChatThread[];

		const threadsMessages = await Promise.all(
			threads.map((thread) => {
				const sql = select('chat_message', ['*'], { thread_id: thread.id });
				return dbAll(sql[0], sql[1]) as Promise<ChatMessage[]>;
			})
		);

		const sqlPersona = select('persona', ['*'], { id: persona_id });
		const persona = (await dbGet(sqlPersona[0], sqlPersona[1])) as Buddy;

		const sqlPersonaVersion = select('persona_version', ['*'], {
			id: persona.current_version_id,
		});
		const personaVersion = (await dbGet(
			sqlPersonaVersion[0],
			sqlPersonaVersion[1]
		)) as BuddyVersion;

		const mergedThreads = threads.map((thread, i) => {
			const threadMessages = threadsMessages[i];
			return {
				...thread,
				latest_message: threadMessages[threadMessages.length - 1],
				selected_buddy: {
					...persona,
					name: personaVersion.name,
					description: personaVersion.description,
					persona_id: persona.id,
					version: personaVersion.version,
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

		const personas = await Promise.all(
			threads.map((thread) => {
				const sqlPersona = select('persona', ['*'], { id: thread.persona_id });
				const persona = dbGet(sqlPersona[0], sqlPersona[1]);
				const sqlPersonaVersion = select('persona_version', ['*'], {
					id: thread.current_persona_version_id,
				});
				const personaVersion = dbGet(sqlPersonaVersion[0], sqlPersonaVersion[1]);
				return Promise.all([persona, personaVersion]) as Promise<
					[Buddy, BuddyVersion]
				>;
			})
		);

		console.log(threadsMessages);

		const mergedThreads = threads.map((thread, i) => {
			const persona = personas[i][0];
			const personaVersion = personas[i][1];
			const threadMessages = threadsMessages[i];
			return {
				...thread,
				latest_message: threadMessages[threadMessages.length - 1],
				selected_buddy: persona
					? {
							...persona,
							name: personaVersion.name,
							description: personaVersion.description,
							persona_id: persona.id,
							version: personaVersion.version,
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
