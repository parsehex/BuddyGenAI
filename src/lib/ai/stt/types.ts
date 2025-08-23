export interface STTRequest {
	prompt?: string;
	/** Default: `false` */
	suppress_non_speech?: boolean;
	/** Default: `"en"` */
	langcode?: string;
	/** base64_wav_data */
	audio_data: string;
}
