import { ref, watch } from 'vue';
import { delay } from '../lib/utils';

export type Provider =
	| 'local'
	| 'disabled'
	| 'openai'
	| 'togetherai'
	| 'aimlapi'
	| 'elevenlabs'
	| 'deepinfra';
export interface Config {
	local_model_directory: string;

	// local, (providers above ^), or disabled?
	selected_provider_chat: Provider;
	selected_provider_image: Provider;
	selected_provider_tts: Provider;
	selected_provider_whisper: Provider;

	openai_api_key: string;
	togetherai_api_key: string;
	aimlapi_api_key: string;
	elevenlabs_api_key: string;
	deepinfra_api_key: string;

	// names or paths to models
	selected_model_chat: string;
	selected_model_image: string;
	selected_model_tts: string;
	selected_model_whisper: string;

	gpu_enabled_chat: boolean;
	gpu_enabled_image: boolean;
	gpu_enabled_whisper: boolean;

	n_gpu_layers: number;
	auto_start_server: boolean;
}
type ModelType = 'chat' | 'image' | 'tts' | 'whisper';

function UseConfig() {
	const isServer =
		// @ts-ignore
		process.server ||
		typeof window === 'undefined' ||
		typeof window.require === 'undefined';
	const isElectron =
		!isServer && navigator.userAgent.toLowerCase().includes('electron');

	if (!isElectron || isServer) return;

	const electron = window.require('electron');
	if (!electron) return;

	const config = ref({} as Config);

	const getModels = (type: ModelType) => {
		return electron.ipcRenderer.invoke('getModels', type);
	};

	const chatModels = ref<string[]>([]);
	const imageModels = ref<string[]>([]);
	const ttsModels = ref<string[]>([]);
	const whisperModels = ref<string[]>([]);

	watch(config, async (newConfig) => {
		// for each of the model types:
		// unless it is disabled, get the selected provider
		// set models to the models for that provider

		await delay(10);

		// chat
		const chatProvider = newConfig.selected_provider_chat;
		const chatHasKey =
			!['local', 'disabled'].includes(chatProvider) &&
			// @ts-ignore
			newConfig[`${chatProvider}_api_key`] !== '';
		if (chatProvider === 'disabled') chatModels.value = [];
		else if (chatProvider === 'local' || chatHasKey) {
			chatModels.value = [...(await getModels('chat'))];
		}

		// image
		const imageProvider = newConfig.selected_provider_image;
		const imageHasKey =
			!['local', 'disabled'].includes(imageProvider) &&
			// @ts-ignore
			newConfig[`${imageProvider}_api_key`] !== '';
		if (imageProvider === 'disabled') imageModels.value = [];
		else if (imageProvider === 'local' || imageHasKey) {
			imageModels.value = await getModels('image');
		}

		// tts
		const ttsProvider = newConfig.selected_provider_tts;
		const ttsHasKey =
			!['local', 'disabled'].includes(ttsProvider) &&
			// @ts-ignore
			newConfig[`${ttsProvider}_api_key`] !== '';
		if (ttsProvider === 'disabled') ttsModels.value = [];
		else if (ttsProvider === 'local' || ttsHasKey) {
			ttsModels.value = await getModels('tts');
		}

		// whisper
		const whisperProvider = newConfig.selected_provider_whisper;
		const whisperHasKey =
			!['local', 'disabled'].includes(whisperProvider) &&
			// @ts-ignore
			newConfig[`${whisperProvider}_api_key`] !== '';
		if (whisperProvider === 'disabled') whisperModels.value = [];
		else if (whisperProvider === 'local' || whisperHasKey) {
			whisperModels.value = await getModels('whisper');
		}
	});

	electron.ipcRenderer.invoke('config:get').then((data) => {
		config.value = { ...data };
		console.log(data);
	});

	const isExternal = (type: ModelType) => {
		return config.value[`selected_provider_${type}`] !== 'local';
	};

	return {
		config,
		updateConfig: async (newConfig: Partial<Config>) => {
			console.trace('updateConfig', newConfig);
			const res = await electron.ipcRenderer.invoke('config:set', newConfig);
			config.value = { ...res };
			return res;
		},
		isExternal,
		chatModels,
		imageModels,
		ttsModels,
		whisperModels,
		getActiveProvider: (type: ModelType) => {
			// TODO so then, in another place we'll define possible providers for each type,
			//   to effectively filter the possible combinations here
			return config.value[`selected_provider_${type}`];
		},
		getModels,
		modelPath: (type: ModelType) => {
			const selectedModel = config.value[`selected_model_${type}`];
			if (!selectedModel) return '';
			const isThisExternal = isExternal(type);
			if (!isThisExternal) {
				const localModelDirectory = config.value.local_model_directory;
				const slash = localModelDirectory.includes('\\') ? '\\' : '/';
				return `${localModelDirectory}${slash}${selectedModel}`;
			}
			return config.value[`selected_model_${type}`];
		},
		restartApp: async () => {
			return await electron.ipcRenderer.invoke('restartApp');
		},
	};
}

const appConfig = UseConfig();
export default appConfig;
