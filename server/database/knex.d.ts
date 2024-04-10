import { knex } from 'knex';

export interface Persona {
	id: number;
	created: Date;
	updated?: Date;
	name: string;
	description?: string;
	profile_pic?: string;
	profile_pic_prompt?: string;
	profile_pic_use_prompt: boolean;
}
export interface ChatThread {
	id: number;
	created: Date;
	name: string;
	persona_id?: number;
	mode: 'persona' | 'custom';
}
export interface ChatMessage {
	id: number;
	created: Date;
	role: 'user' | 'assistant';
	content: string;
	thread_id: number;
}

declare module 'knex/types/tables' {
	interface Tables {
		persona: Persona;
		chat_thread: ChatThread;
		chat_message: ChatMessage;
	}
}
