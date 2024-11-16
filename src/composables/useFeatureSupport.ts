import { ref, watch } from 'vue';
import appConfig from './useConfig';
import { delay } from '../lib/utils';

type Provider =
	| 'local'
	| 'disabled'
	| 'openai'
	| 'togetherai'
	| 'aimlapi'
	| 'elevenlabs'
	| 'deepinfra';
type ModelType = 'chat' | 'image' | 'tts' | 'whisper';

const ProviderModelSupport: Record<Provider, ModelType[]> = {
	local: ['chat', 'image', 'tts', 'whisper'],
	disabled: [],
	openai: ['chat', 'image', 'tts', 'whisper'],
	togetherai: ['chat', 'image'],
	aimlapi: ['chat', 'image', 'whisper'],
	elevenlabs: ['tts'],
	deepinfra: ['chat', 'image', 'tts', 'whisper'],
};

function UseFeatureSupport() {
	const isServer =
		// @ts-ignore
		process.server ||
		typeof window === 'undefined' ||
		typeof window.require === 'undefined';
	const isElectron =
		!isServer && navigator.userAgent.toLowerCase().includes('electron');

	if (!isElectron || isServer) return;
	if (!appConfig) return;

	const electron = window.require('electron');
	if (!electron) return;

	const platform = process.platform;
	const featureSupport = ref({
		chat: false,
		image: false,
		tts: false,
		whisper: false,
	} as Record<ModelType, boolean>);
	// local not supported if not windows

	const getProviders = async (type: ModelType) => {
		const list: Provider[] = [];
		for (const provider in ProviderModelSupport) {
			if (ProviderModelSupport[provider as Provider].includes(type)) {
				if (provider === 'local') {
					list.push(provider as Provider);
					continue;
				}
				// @ts-ignore
				const key = appConfig?.config.value[`${provider}_api_key`];
				if (!key) continue;
				list.push(provider as Provider);
			}
		}
		if (platform !== 'win32') {
			const i = list.indexOf('local');
			if (i >= 0) list.splice(i, 1);
		}
		return list;
	};

	const isProviderModelSupported = (provider: Provider) => {
		if (!appConfig) return false;
		if (provider === 'local') {
			return platform === 'win32';
		}
		if (provider === 'disabled') {
			return false;
		}
		const cfg = appConfig?.config.value;
		const key = cfg[`${provider}_api_key`];
		if (!key) return false;
		return true;
	};

	watch(
		appConfig.config,
		async (newConfig) => {
			const chatProviders = await getProviders('chat');
			const chatProvider = appConfig?.getActiveProvider('chat');
			const chatModel = appConfig?.modelPath('chat');
			const chatReady = !!(chatProvider && chatModel);
			const imageProviders = await getProviders('image');
			const imageProvider = appConfig?.getActiveProvider('image');
			const imageModel = appConfig?.modelPath('image');
			const imageReady = !!(imageProvider && imageModel);
			const ttsProviders = await getProviders('tts');
			const ttsProvider = appConfig?.getActiveProvider('tts');
			const ttsModel = appConfig?.modelPath('tts');
			const ttsReady = !!(ttsProvider && ttsModel);
			const whisperProviders = await getProviders('whisper');
			const whisperProvider = appConfig?.getActiveProvider('whisper');
			const whisperModel = appConfig?.modelPath('whisper');
			const whisperReady = !!(whisperProvider && whisperModel);
			featureSupport.value = {
				chat: chatProviders.length > 0 && chatReady,
				image: imageProviders.length > 0 && imageReady,
				tts: ttsProviders.length > 0 && ttsReady,
				whisper: whisperProviders.length > 0 && whisperReady,
			};
		},
		{ immediate: true }
	);

	return {
		featureSupport,
		isProviderModelSupported,
		getProviders,
		supportsLocalModels: platform === 'win32', // TODO check cuda too
	};
}

const appFeatureSupport = UseFeatureSupport();
export default appFeatureSupport;
