import { knex } from 'knex';

export interface Persona {
	id: number;
	created: number;
	updated: number | null;
	name: string;
	description: string | null;
	profile_pic: string | null;
	profile_pic_prompt: string | null;
	profile_pic_use_prompt: boolean;
}
export interface ChatThread {
	id: number;
	created: number;
	name: string;
	persona_id: number | null;
	mode: 'persona' | 'custom';
}
export interface ChatMessage {
	id: number;
	created: number;
	updated: number | null;
	role: 'user' | 'assistant' | 'system';
	content: string;
	thread_id: number;
	thread_index: number;
}

declare module 'knex/types/tables' {
	interface Tables {
		persona: Persona;
		chat_thread: ChatThread;
		chat_message: ChatMessage;
	}
}
