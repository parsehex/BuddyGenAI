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
}
