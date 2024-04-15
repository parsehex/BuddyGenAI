import { knex } from 'knex';
import { AppSettings, ChatMessage, ChatThread, Persona, PersonaVersion } from './types';

declare module 'knex/types/tables' {
	interface Tables {
		app_settings: AppSettings;
		chat_message: ChatMessage;
		chat_thread: ChatThread;
		persona: Persona;
		persona_version: PersonaVersion;
	}
}
