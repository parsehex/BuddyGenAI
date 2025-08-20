export interface Message {
	id: string;
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface ChatRequest {
	messages: Message[];
	temperature?: number;
	max_tokens?: number;
	/** Constrains the model to produce JSON-compatible output.
	 *
	 * **You still need to instruct the model's response.** */
	json?: boolean;
	stop?: string[];
	stream?: boolean;
	/** Callback to receive the current full content. Unused if `stream = false` */
	stream_callback?: (chunk: string) => void;
}

export interface ModelObject {
	model_id: string;
	model_url: string;
}
