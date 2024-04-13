export interface Persona {
	id: string;
	created: number;
	updated: number | null;
	// name: string;
	// description: string | null;
	profile_pic: string | null;
	profile_pic_prompt: string | null;
	profile_pic_use_prompt: boolean;
	current_version_id: string;
}
export interface PersonaVersion {
	id: string;
	created: number;
	persona_id: string;
	version: number;
	name: string;
	description: string | null;
}
export interface PersonaVersionMerged {
	id: string;
	created: number;
	updated: number | null;
	persona_id: string;
	version: number;
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
	mode: 'persona' | 'custom';
	persona_id: string | null;
	// TODO add current persona version (exclusive with persona_mode_use_current -- only one should be set)
	persona_mode_use_current: boolean | null;
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
