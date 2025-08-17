import * as webllm from '@mlc-ai/web-llm';
import type { ChatMessage } from '../api/types-db';
import { AppSettings } from '../api/AppSettings';

let engine: webllm.MLCEngineInterface;

export async function loadModel(
	modelName = '',
	initCb?: (report: webllm.InitProgressReport) => void
) {
	modelName = modelName || (AppSettings.get('selected_model_chat') as string);
	if (!modelName) throw new Error('Did not find selected chat model');
	engine = await webllm.CreateMLCEngine(modelName, {
		initProgressCallback: initCb,
	});
	return engine;
}

interface ChatRequest {
	messages: ChatMessage[];
	temperature?: number;
	max_tokens?: number;
	stop?: string[];
	stream?: boolean;
	stream_callback?: (chunk: string) => void;
}

export async function chat(req: ChatRequest) {
	if (!engine) await loadModel();
	const { stream_callback } = req;
	req = JSON.parse(JSON.stringify(req));
	const { messages, temperature, max_tokens, stop, stream } = req;
	const stream_options = stream ? { include_usage: true } : undefined;

	const lastMsg = messages[messages.length - 1];
	if (lastMsg.role === 'assistant') messages.length -= 1;

	const reply = await engine.chat.completions.create({
		messages,
		temperature,
		max_tokens,
		stop,
		stream,
		stream_options,
	});

	if (!isAsyncIterable(reply)) {
		// @ts-ignore
		return reply.choices[0].message.content;
	}

	// @ts-ignore
	for await (const chunk of reply) {
		// @ts-ignore
		const chunkStr = chunk.choices[0]?.delta.content || '';
		if (stream_callback) {
			stream_callback(chunkStr);
		}
		// if (chunk.usage) {
		//     console.log(chunk.usage); // only last chunk has usage
		// }
	}

	return await engine.getMessage();
}

export function getModels() {
	const prebuiltConfig = webllm.prebuiltAppConfig;
	return prebuiltConfig.model_list.map((v) => ({
		model_id: v.model_id,
		model_url: v.model,
	}));
}

function isAsyncIterable(input: any) {
	if (input == null) {
		return false; // Null or undefined values cannot be async iterable
	}
	return typeof input[Symbol.asyncIterator] === 'function';
}
