import * as fs from 'fs-extra';
import * as path from 'path';
import { ModelType, Provider } from './types';
import * as config from '../config';
import { getProviderKey } from './keys';

const cache = new Map<string, string[]>();

export async function getProviderModels(type: ModelType) {
	const cfg = config.get();
	const provider = cfg[`selected_provider_${type}`];
	if (provider === 'disabled') {
		return [];
	}
	if (provider === 'local') {
		return getLocalModels(type);
	}
	const key = `${type}_${provider}`;
	if (cache.has(key)) {
		return cache.get(key);
	}
	if (provider === 'openai' || provider === 'togetherai') {
		console.log(`Getting models for ${type} ${provider}`);
		const models = await getOpenaiModels(type, provider);
		cache.set(key, models);
		return models;
	}
	throw new Error(`Unknown provider: ${provider}`);
}

// export function getProviderModels(provider: Provider) {
// 	//
// }

async function getLocalModels(type: ModelType) {
	const exts = {
		chat: '.gguf',
		image: '.safetendors',
		tts: '.onnx',
		whisper: '.bin',
	};
	const cfg = config.get();
	const modelDir = cfg.local_model_directory;
	const files = await fs.readdir(modelDir);
	const ext = exts[type];
	const filteredFiles = files.filter((file) => file.endsWith(ext));
	return filteredFiles;
}

const openaiBases = {
	openai: 'https://api.openai.com/v1',
	togetherai: 'https://api.together.xyz/v1',
} as Record<Provider, string>;
async function getOpenaiModels(type: ModelType, provider: Provider) {
	const key = getProviderKey(provider);
	const base = openaiBases[provider];
	const res = await fetch(base + '/models', {
		headers: { Authorization: `Bearer ${key}` },
	});
	const json = await res.json();
	// write json to file for debugging
	// console.log(__dirname);
	// const jsonPath = path.join(__dirname, 'models.json');
	// await fs.writeFile(jsonPath, JSON.stringify(json, null, 2));
	const arr: any[] = provider === 'openai' ? json.data : json;
	const models = arr
		.filter((model) => {
			if (provider === 'openai') return true;
			if (provider === 'togetherai') {
				return model.type === type;
			}
		})
		.map((model) => model.id)
		.filter((id: string) => {
			if (provider !== 'openai') return true;
			if (type === 'chat') {
				return id.startsWith('gpt-') || id.startsWith('chatgpt-');
			} else if (type === 'image') {
				//
				return id.startsWith('dall-e-');
			} else if (type === 'tts') {
				return id.startsWith('tts-');
			} else if (type === 'whisper') {
				return id.startsWith('whisper-');
			}
		});
	return models;
}
