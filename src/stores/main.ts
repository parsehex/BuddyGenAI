import { defineStore } from 'pinia';
import { ref, computed, watch, onBeforeMount } from 'vue';
import type {
	ChatMessage,
	ChatThread,
	MergedChatThread,
	BuddyVersionMerged,
	SQLiteVal,
} from '@/lib/api/types-db';

import { api } from '@/lib/api';
import useLlamaCpp from '@/composables/useLlamaCpp';
import urls from '@/lib/api/urls';

// @ts-ignore
const { isServerRunning } = useLlamaCpp();

const lastFetchMap: Record<string, number> = {};
function shouldGet(name: string, interval: number) {
	const now = Date.now();
	const lastFetch = lastFetchMap[name] || 0;
	if (now - lastFetch > interval) {
		lastFetchMap[name] = now;
		return true;
	}
	return false;
}

type Provider = 'external' | 'local' | 'custom';
interface Settings {
	user_name: string;
	local_model_directory: string;
	selected_provider_chat: Provider;
	selected_provider_image: Provider;
	selected_model_chat: string;
	selected_model_image: string;
	selected_model_tts: string;
	selected_model_whisper: string;
	gpu_enabled_chat: number;
	gpu_enabled_image: number;
	gpu_enabled_whisper: number;
	chat_image_enabled: number;
	chat_image_quality: string;
	external_api_key: string;
	fresh_db: number;
	n_gpu_layers: number;
	auto_send_stt: number;
	auto_read_chat: number;
	auto_start_server: number;
	skip_start_dialog: number;
}

let firstRun = true;
export const useAppStore = defineStore('app', () => {
	const selectedBuddyId = ref<string>('');
	const threadMessages = ref<ChatMessage[]>([]);
	const setThreadMessages = (messages: ChatMessage[]) => {
		threadMessages.value.length = 0;
		threadMessages.value.push(...messages);
	};

	const chatModels = ref([] as string[]);
	const imageModels = ref([] as string[]);
	const ttsModels = ref([] as string[]);
	const whisperModels = ref([] as string[]);
	const buddies = ref([] as BuddyVersionMerged[]);
	const settings = ref({} as Settings);
	const threads = ref([] as MergedChatThread[]);

	const isExternalProvider = computed(
		() => settings.value.selected_provider_chat === 'external'
	);

	onBeforeMount(async () => {
		const [cM, iM, tM, wM, p, s, t] = await Promise.all([
			api.model.getAll('chat'),
			api.model.getAll('image'),
			api.model.getAll('tts'),
			api.model.getAll('whisper'),
			api.buddy.getAll(),
			api.setting.getAll(),
			api.thread.getAll(),
		]);

		if (cM) {
			chatModels.value.length = 0;
			chatModels.value.push(...cM);
		}
		if (iM) {
			imageModels.value.length = 0;
			imageModels.value.push(...iM);
		}
		if (p) {
			buddies.value.length = 0;
			buddies.value.push(...p);
		}
		if (s) Object.assign(settings.value, s);
		if (t) {
			threads.value.length = 0;
			threads.value.push(...t);
		}
	});

	const updateChatModels = async () => {
		const res = await api.model.getAll('chat');
		if (!res) {
			console.log('no chat models found');
			return [];
		}
		chatModels.value.length = 0;
		chatModels.value.push(...res);
		return res;
	};
	const updateImageModels = async () => {
		const res = await api.model.getAll('image');
		if (!res) {
			console.log('no image models found');
			return [];
		}
		imageModels.value.length = 0;
		imageModels.value.push(...res);
		return res;
	};
	const updateTTSModels = async () => {
		const res = await api.model.getAll('tts');
		if (!res) {
			console.log('no tts models found');
			return [];
		}
		ttsModels.value.length = 0;
		ttsModels.value.push(...res);
		return res;
	};
	const updateWhisperModels = async () => {
		const res = await api.model.getAll('whisper');
		if (!res) {
			console.log('no whisper models found');
			return [];
		}
		whisperModels.value.length = 0;
		whisperModels.value.push(...res);
		return res;
	};
	const updateModels = async (
		certain?: 'chat' | 'image' | 'tts' | 'whisper'
	) => {
		if (certain === 'chat') {
			const res = await updateChatModels();
			return { chatModels: res };
		} else if (certain === 'image') {
			const res = await updateImageModels();
			return { imageModels: res };
		} else if (certain === 'tts') {
			const res = await updateTTSModels();
			return { ttsModels: res };
		} else if (certain === 'whisper') {
			const res = await updateWhisperModels();
			return { whisperModels: res };
		}
		const [chat, image, tts, whisper] = await Promise.all([
			updateChatModels(),
			updateImageModels(),
			updateTTSModels(),
			updateWhisperModels(),
		]);

		return {
			chatModels: chat,
			imageModels: image,
			ttsModels: tts,
			whisperModels: whisper,
		};
	};
	const updateBuddies = async () => {
		const res = await api.buddy.getAll();
		if (!res) return [];
		buddies.value.length = 0;
		buddies.value.push(...res);
		return res;
	};
	const updateSettings = async () => {
		const res = await api.setting.getAll();
		if (!res) return {};
		Object.assign(settings.value, res);
		return res;
	};
	const saveSettings = async (newVal: Record<string, SQLiteVal>) => {
		await api.setting.update(newVal);
	};
	const updateThreads = async () => {
		const res = await api.thread.getAll();
		if (!res) return [];
		threads.value.length = 0;
		threads.value.push(...res);
		return res;
	};

	const getNGpuLayers = () => {
		return settings.value.n_gpu_layers;
	};

	const getChatModelPath = () => {
		if (!settings.value.local_model_directory) return '';
		if (!settings.value.selected_model_chat) return '';
		const slash = settings.value.local_model_directory.includes('\\')
			? '\\'
			: '/';
		return `${settings.value.local_model_directory}${slash}${settings.value.selected_model_chat}`;
	};
	const getImageModelPath = () => {
		if (!settings.value.local_model_directory) return '';
		if (!settings.value.selected_model_image) return '';
		const slash = settings.value.local_model_directory.includes('\\')
			? '\\'
			: '/';
		return `${settings.value.local_model_directory}${slash}${settings.value.selected_model_image}`;
	};
	const getTTSModelPath = (buddyId?: string) => {
		if (!settings.value.local_model_directory) return '';
		if (!settings.value.selected_model_tts) return '';
		if (settings.value.selected_model_tts === '0') return '';

		let modelToUse = settings.value.selected_model_tts;
		if (buddyId) {
			const buddy = buddies.value.find((b) => b.id === buddyId);
			if (buddy && buddy.tts_voice) {
				modelToUse = buddy.tts_voice;
			}
		}
		const slash = settings.value.local_model_directory.includes('\\')
			? '\\'
			: '/';
		return `${settings.value.local_model_directory}${slash}${modelToUse}`;
	};
	const getWhisperModelPath = () => {
		if (!settings.value.local_model_directory) return '';
		if (!settings.value.selected_model_whisper) return '';
		if (settings.value.selected_model_whisper === '0') return '';
		const slash = settings.value.local_model_directory.includes('\\')
			? '\\'
			: '/';
		return `${settings.value.local_model_directory}${slash}${settings.value.selected_model_whisper}`;
	};

	// watch(
	// 	() => route,
	// 	async (newVal) => {
	// 		// if we're on a chat thread, get its messages
	// 		if (newVal.path.includes('chat')) {
	// 			const threadId = newVal.params.id as string;
	// 			const res = await api.message.getAll(threadId);
	// 			if (!res) return;
	// 			threadMessages.value.length = 0;
	// 			threadMessages.value.push(...res);
	// 		}
	// 	}
	// );

	watch(
		settings.value,
		async (newVal) => {
			if (firstRun) {
				firstRun = false;
				return;
			}

			console.log('settings changed', newVal);

			await saveSettings(newVal);
		},
		{ deep: true }
	);

	const chatServerRunning = ref(false);
	const chatServerStarting = ref(false);
	const updateChatServerRunning = async () => {
		const running: { isRunning: boolean } = await isServerRunning();
		chatServerRunning.value = running.isRunning;
	};

	const imgGenerating = ref(false);
	const updateImgGenerating = (val: boolean) => {
		imgGenerating.value = val;
	};
	const imgProgress = ref(0);
	const updateImgProgress = (val: number) => {
		imgProgress.value = val;
	};

	function getSDProgress() {
		const eventSource = new EventSource(urls.sd.progress());

		eventSource.onmessage = function (event) {
			const data = JSON.parse(event.data);
			if (data.type === 'start') {
				updateImgProgress(0);
				updateImgGenerating(true);
			} else if (data.type === 'stop') {
				updateImgProgress(1);
				updateImgGenerating(false);
			} else if (data.type === 'progress') {
				if (data.progress >= 0.95) {
					updateImgGenerating(false);
				}
				updateImgProgress(data.progress);
			}
		};

		eventSource.onerror = function (error) {
			updateImgGenerating(false);
			updateImgProgress(0);
		};
	}
	getSDProgress();

	// newHere if db is fresh or if there are no threads or buddies
	const newHere = computed(
		() =>
			!!+settings.value.fresh_db ||
			(!threads.value.length && !buddies.value.length)
	);

	const proceed = ref(false);

	const isModelsSetup = computed(() => {
		if (proceed.value) return true;

		if (isExternalProvider.value) {
			return (
				!!settings.value.external_api_key &&
				!!settings.value.selected_model_chat &&
				!!settings.value.selected_model_image
			);
		}
		const hasModelDir = !!settings.value.local_model_directory;
		const hasChatModel = !!settings.value.selected_model_chat;
		const hasImageModel = !!settings.value.selected_model_image;
		const hasTTSModel = !!settings.value.selected_model_tts;
		const hasWhisperModel = !!settings.value.selected_model_whisper;
		return (
			hasModelDir &&
			hasChatModel &&
			hasImageModel &&
			hasTTSModel &&
			hasWhisperModel
		);
	});

	const modelProvider = computed({
		get: () => {
			// should be the same for both
			return settings.value.selected_provider_chat;
		},
		set: (value) => {
			settings.value.selected_provider_chat = value;
			settings.value.selected_provider_image = value;
		},
	});

	return {
		selectedBuddyId,
		threadMessages,
		setThreadMessages,
		chatModels,
		imageModels,
		ttsModels,
		whisperModels,
		buddies,
		settings,
		threads,
		newHere,
		modelProvider,

		updateModels,
		updateBuddies,
		updateSettings,
		saveSettings,
		updateThreads,
		getNGpuLayers,
		getChatModelPath,
		getImageModelPath,
		getTTSModelPath,
		getWhisperModelPath,

		isExternalProvider,
		proceed,
		isModelsSetup,

		chatServerRunning,
		chatServerStarting,
		updateChatServerRunning,

		imgGenerating,
		updateImgGenerating,
		imgProgress,
		updateImgProgress,

		toggleAutoStartServer: () => {
			settings.value.auto_start_server = settings.value.auto_start_server ? 0 : 1;
		},
		toggleAutoReadChat: () => {
			settings.value.auto_read_chat = settings.value.auto_read_chat ? 0 : 1;
		},
		toggleAutoReadSTT: () => {
			settings.value.auto_send_stt = settings.value.auto_send_stt ? 0 : 1;
		},
	};
});
