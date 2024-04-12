export interface Persona {
	id: string;
	created: number;
	updated: number | null;
	name: string;
	description: string | null;
	profile_pic: string | null;
	profile_pic_prompt: string | null;
	profile_pic_use_prompt: boolean;
}
export interface ChatThread {
	id: string;
	created: number;
	name: string;
	persona_id: string | null;
	mode: 'persona' | 'custom';
}
export interface ChatMessage {
	id: string;
	created: number;
	updated: number | null;
	role: 'user' | 'assistant' | 'system';
	content: string;
	thread_id: string;
	thread_index: number;
}
