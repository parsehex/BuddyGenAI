import type {
	ChatMessage,
	ChatThread,
	MergedChatThread,
	Persona,
} from '@/lib/api/types-db';
import { select } from '@/lib/sql';

const { dbAll, dbGet } = useElectron();

export default async function getAll(
	persona_id?: string
): Promise<MergedChatThread[]> {
	if (!dbAll) throw new Error('dbAll is not defined');

	if (persona_id) {
		const sql = select('chat_thread', ['*'], { persona_id });
		const threads = (await dbAll(sql[0], sql[1])) as ChatThread[];

		const messages = await Promise.all(
			threads.map((thread) => {
				const sql = select('chat_message', ['*'], { thread_id: thread.id });
				return dbAll(sql[0], sql[1]);
			})
		);

		const sqlPersona = select('persona', ['*'], { id: persona_id });
		const persona = (await dbGet(sqlPersona[0], sqlPersona[1])) as Persona;

		const sqlPersonaVersion = select('persona_version', ['*'], {
			id: persona.current_version_id,
		});
		const personaVersion = await dbGet(
			sqlPersonaVersion[0],
			sqlPersonaVersion[1]
		);

		const mergedThreads = threads.map((thread, i) => {
			return {
				...thread,
				latest_message: messages[i][messages[i].length - 1],
				selected_buddy: {
					...persona,
					...personaVersion,
				},
			};
		});
		return mergedThreads;
	} else {
		const sql = select('chat_thread', ['*']);
		const threads = (await dbAll(sql[0], sql[1])) as ChatThread[];

		const messages = await Promise.all(
			threads.map((thread) => {
				const sql = select('chat_message', ['*'], { thread_id: thread.id });
				return dbAll(sql[0], sql[1]);
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
				return Promise.all([persona, personaVersion]);
			})
		);

		console.log('personas', personas);

		const mergedThreads = threads.map((thread, i) => {
			const persona = personas[i][0];
			const personaVersion = personas[i][1];
			console.log('persona', persona, 'personaVersion', personaVersion);
			return {
				...thread,
				latest_message: messages[i][messages[i].length - 1],
				selected_buddy: {
					...persona,
					...personaVersion,
				},
			};
		});
		console.log('mergedThreads', mergedThreads);
		return mergedThreads;
	}
}
