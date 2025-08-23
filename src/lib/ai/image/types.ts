export interface ImageRequest {
	posPrompt: string;
	negPrompt?: string;
	/** Shorthand -- **515** for 512x512 / **768** for 512x768 */
	size?: number;
	steps?: number;
}
