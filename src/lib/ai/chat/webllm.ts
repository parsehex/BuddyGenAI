import type {
	MLCEngineInterface,
	InitProgressReport,
	AppConfig,
} from '@mlc-ai/web-llm';
import { AppSettings, type LLMProvider } from '../../api/AppSettings';
import type { ChatRequest, ModelObject } from './types';
import { isAsyncIterable } from '../../utils';

let engine: MLCEngineInterface;
let prebuiltAppConfig: AppConfig;

export async function loadModel(
	modelName = '',
	initProgressCallback?: (report: InitProgressReport) => void
) {
	const provider = AppSettings.get('selected_provider_chat') as LLMProvider;
	if (provider !== 'webllm') return;

	const webllm = await import('@mlc-ai/web-llm');
	prebuiltAppConfig = webllm.prebuiltAppConfig;
	modelName = modelName || (AppSettings.get('selected_model_chat') as string);
	if (!modelName) throw new Error('Did not find selected chat model');

	engine = await webllm.CreateMLCEngine(modelName, {
		initProgressCallback,
	});
	return engine;
}

export async function chat(req: ChatRequest) {
	const provider = AppSettings.get('selected_provider_chat') as LLMProvider;
	if (provider !== 'webllm') throw new Error('Called wrong provider');
	if (!engine) await loadModel();
	const { stream_callback } = req;
	req = JSON.parse(JSON.stringify(req));
	const { messages, temperature, max_tokens, stop, stream, json } = req;
	const stream_options = stream ? { include_usage: true } : undefined;

	const lastMsg = messages[messages.length - 1];
	if (lastMsg.role === 'assistant') messages.length -= 1;

	const options = {
		messages,
		temperature,
		max_tokens,
		stop,
		stream,
		stream_options,
	} as any;
	if (json) options.response_format = { type: 'json_object' };

	const reply = await engine.chat.completions.create(options);

	if (!isAsyncIterable(reply)) {
		// @ts-ignore
		return reply.choices[0].message.content as string;
	}

	let allContent = '';
	// @ts-ignore
	for await (const chunk of reply) {
		// @ts-ignore
		const chunkStr = chunk.choices[0]?.delta.content || '';
		allContent += chunkStr;
		if (stream_callback) {
			stream_callback(allContent);
		}
		// if (chunk.usage) {
		//     console.log(chunk.usage); // only last chunk has usage
		// }
	}

	return await engine.getMessage();
}

export function stop() {
	if (!engine) return false;
	engine.interruptGenerate();
	return true;
}

export async function getModels() {
	if (!prebuiltAppConfig) return [];
	return prebuiltAppConfig.model_list.map((v) => ({
		model_id: v.model_id,
		model_url: v.model,
	})) as ModelObject[];
}
