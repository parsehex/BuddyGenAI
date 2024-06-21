export interface DeleteResponse {
	success: boolean;
}

export enum ProfilePicQuality {
	LOW = 1,
	MEDIUM = 2,
	HIGH = 3,
}

export interface SDOptions {
	model: string;
	pos: string;
	output: string;
	neg?: string;
	size?: number;
	steps?: number;
}

export interface PiperOptions {
	model: string;
	output: string;
	text: string;
}

export interface WhisperOptions {
	model: string;
	input: Buffer;
}

export interface CreateBuddyOptions {
	name: string;
	tts_voice?: string;
	description?: string;
	profile_pic?: string;
	profile_pic_prompt?: string;
	profile_pic_use_prompt?: boolean;
	appearance_options?: string;
	selected_appearance_options?: string;
}

export interface UpdateBuddyOptions {
	id: string;
	name?: string;
	tts_voice?: string;
	description?: string;
	profile_pic?: string;
	profile_pic_prompt?: string;
	profile_pic_use_prompt?: boolean;
	appearance_options?: string;
	selected_appearance_options?: string;
}
