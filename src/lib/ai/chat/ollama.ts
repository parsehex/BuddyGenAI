import type { Ollama } from 'ollama';
import { AppSettings, type LLMProvider } from '../../api/AppSettings';
import type { ChatRequest, ModelObject } from './types';
import { isAsyncIterable } from '../../utils';

let engine: Ollama;

export async function loadModel(modelName = '') {
	const provider = AppSettings.get('selected_provider_chat') as LLMProvider;
	if (provider !== 'ollama') return;

	const host = AppSettings.get('ollama_host') as string;
	if (!host) throw new Error('Did not find Ollama host');

	const { Ollama } = await import('ollama');
	engine = new Ollama({ host });
	return engine;
}

export async function chat(req: ChatRequest) {
	const provider = AppSettings.get('selected_provider_chat') as LLMProvider;
	if (provider !== 'ollama') throw new Error('Called wrong provider');
	const model = AppSettings.get('selected_model_chat') as string;
	if (!model) throw new Error('Missing selected chat model');
	if (!engine) await loadModel();

	const { stream_callback } = req;
	req = JSON.parse(JSON.stringify(req));
	const { messages, temperature, max_tokens, stop, stream, json } = req;

	const lastMsg = messages[messages.length - 1];
	if (lastMsg.role === 'assistant') messages.length -= 1;

	const options = {
		messages,
		model,
		stream,
		options: { temperature, stop, max_tokens },
	} as any;
	if (json) options.format = 'json';

	const reply = await engine.chat(options);

	if (!stream || !isAsyncIterable(reply)) {
		// @ts-ignore
		return reply.message.content;
	}

	let allContent = '';
	for await (const chunk of reply) {
		const chunkStr = chunk.message.content || '';
		allContent += chunkStr;
		if (stream_callback) {
			stream_callback(allContent);
		}
	}

	return allContent;
}

export function stop() {
	if (!engine) return false;
	engine.abort();
	return true;
}

export async function getModels() {
	if (!engine) await loadModel();
	return (await engine.list()).models.map((v) => ({
		model_id: v.name,
		model_url: v.name,
	})) as ModelObject[];
}
