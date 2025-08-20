import * as webllm from '@mlc-ai/web-llm';
import { AppSettings, type LLMProvider } from '../../api/AppSettings';
import type { ChatRequest, ModelObject } from './types';
import urls from '../../api/urls';
import axios from 'axios';

let abortCtlr: AbortController | null = null;

export async function chat(req: ChatRequest): Promise<string> {
	return new Promise(async (resolve) => {
		abortCtlr = new AbortController();
		const provider = AppSettings.get('selected_provider_chat') as LLMProvider;
		if (provider !== 'koboldcpp' && provider !== 'openrouter')
			throw new Error('Called wrong provider');
		const model = AppSettings.get('selected_model_chat') as string;

		const { stream_callback } = req; // pull out un-cloneable
		req = JSON.parse(JSON.stringify(req));
		const { messages, temperature, max_tokens, stop, stream, json } = req;

		const lastMsg = messages[messages.length - 1];
		if (lastMsg.role === 'assistant') messages.length -= 1;

		const data = {
			messages,
			model,
			temperature,
			max_tokens,
			stop,
			stream,
		} as any;
		if (json) data.response_format = { type: 'json_object' };

		let allContent = '';
		let latestChunk = -1;

		const key = AppSettings.get('openrouter_api_key') as string; // doesn't matter when using kobold
		const reply = await axios(await urls.other.llamacppServerUrl(), {
			signal: abortCtlr.signal,
			method: 'POST',
			headers: {
				Authorization: 'Bearer ' + key,
				'Content-Type': 'application/json',
				'HTTP-Referer': 'https://buddygenai.com/',
				'X-Title': 'BuddyGenAI',
			},
			data: JSON.stringify(data),
			onDownloadProgress: stream
				? (progressEvent) => {
						const xhr = progressEvent.event.target;
						const { responseText } = xhr;
						// responseText contains all chunks so far
						// TODO can improve logic/perf by storing chunks and only processing latest line(s)
						const chunks = responseText.split('data:').map((c: string) => c.trim());
						for (let i = 0; i < chunks.length; i++) {
							const chunkStr = chunks[i];
							if (!chunkStr || chunkStr[0] === ':') continue;
							if (chunkStr.trim() === '[DONE]') {
								// isLast = true;
								break;
							}
							if (i <= latestChunk) continue;

							const chunk = JSON.parse(chunkStr);
							const chunkContent = chunk.choices[0].delta.content || '';
							allContent += chunkContent;
							if (stream_callback) stream_callback(allContent);
							latestChunk = i;
						}
				  }
				: undefined,
		});

		const finalContent: string = stream
			? allContent
			: reply.data.choices[0].message.content;
		resolve(finalContent);
	});
}

export function stop() {
	if (!abortCtlr) return false;
	abortCtlr.abort();
	abortCtlr = null;
	return true;
}

export async function getModels() {
	const key = AppSettings.get('openrouter_api_key') as string;
	const response = await axios(await urls.other.chatModelsOpenaiUrl(), {
		method: 'GET',
		headers: {
			Authorization: 'Bearer ' + key,
			'Content-Type': 'application/json',
			'HTTP-Referer': 'https://buddygenai.com/',
			'X-TITLE': 'BuddyGenAI',
		},
	});
	return response.data.data.map((v: any) => ({
		model_id: v.id,
		model_url: v.id,
	})) as ModelObject[];
}
