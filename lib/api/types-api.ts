export interface DeleteResponse {
	success: boolean;
}

export enum ProfilePicQuality {
	LOW = 128,
	MEDIUM = 256,
	HIGH = 512,
}

export interface SDOptions {
	model: string;
	pos: string;
	output: string;
	neg?: string;
	size?: number;
}
