export type SQLiteVal = string | number | null;

export interface Buddy {
	id: string;
	created: number;
	updated: number | null;
	tts_voice: string | null;
	profile_pic: string | null;
	profile_pic_prompt: string | null;
	profile_pic_use_prompt: boolean;
	current_version_id: string;
}
export interface BuddyVersion {
	id: string;
	created: number;
	persona_id: string;
	version: number;
	name: string;
	description: string | null;
}
export interface BuddyVersionMerged {
	id: string;
	created: number;
	updated: number | null;
	tts_voice: string | null;
	persona_id: string;
	version: number;
	name: string;
	description: string | null;
	profile_pic: string | null;
	profile_pic_prompt: string | null;
	profile_pic_use_prompt: boolean;
	current_version_id: string;
}

export interface ChatThread {
	id: string;
	created: number;
	name: string;
	mode: 'persona' | 'custom';
	persona_id: string | null;
	current_persona_version_id: string | null;
	persona_mode_use_current: boolean | null;
}
export interface ChatMessage {
	id: string;
	created: number;
	updated: number | null;
	role: 'user' | 'assistant' | 'system';
	content: string;
	image: string | null;
	tts: string | null;
	thread_id: string;
	thread_index: number;
}

export interface AppSettings {
	name: string;
	value: string;
}

export interface MergedChatThread extends ChatThread {
	latest_message: ChatMessage;
	selected_buddy: BuddyVersionMerged | null;
}
