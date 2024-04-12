import { knex } from 'knex';

declare module 'knex/types/tables' {
	interface Tables {
		persona: Persona;
		chat_thread: ChatThread;
		chat_message: ChatMessage;
	}
}
