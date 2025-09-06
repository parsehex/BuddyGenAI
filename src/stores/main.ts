import { defineStore } from 'pinia';
import { ref, computed, watch, onBeforeMount, nextTick } from 'vue';
import type {
	ChatMessage,
	MergedChatThread,
	BuddyVersionMerged,
	DBVal,
} from '@/lib/api/types-db';
import { api } from '@/lib/api';
import urls from '@/lib/api/urls';
import { AppSettings, type Settings } from '../lib/api/AppSettings';
import { delay } from '../lib/utils';

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

interface KoboldVersionResult {
	result: 'KoboldCpp';
	version: string;
	protected: boolean;
	llm: boolean;
	txt2img: boolean;
	vision: boolean;
	transcribe: boolean;
	multiplayer: boolean;
	websearch: boolean;
	tts: boolean;
	embeddings: boolean;
	savedata: boolean;
	admin: 0;
	guidance: boolean;
}
interface OllamaVersionResult {
	version: string;
}

let firstRun = true;
export const useAppStore = defineStore('app', () => {
	const selectedBuddyId = ref<string>('');
	const threadMessages = ref<ChatMessage[]>([]);
	const setThreadMessages = (messages: ChatMessage[]) => {
		threadMessages.value.length = 0;
		threadMessages.value.push(...messages);
	};

	const ttsModels = ref([] as string[]);
	const whisperModels = ref([] as string[]);
	const buddies = ref([] as BuddyVersionMerged[]);
	const settings = ref({} as Settings);
	const threads = ref([] as MergedChatThread[]);
	const lastKoboldVersionResult = ref({} as KoboldVersionResult);
	const lastOllamaVersionResult = ref({} as OllamaVersionResult);

	onBeforeMount(async () => {
		const [b, s, t] = await Promise.all([
			api.buddy.getAll(),
			api.setting.getAll(),
			api.thread.getAll(),
		]);

		if (b) {
			buddies.value.length = 0;
			buddies.value.push(...b);
		}
		if (s) Object.assign(settings.value, s);
		if (t) {
			threads.value.length = 0;
			threads.value.push(...t);
		}
	});

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
	const updateModels = async (certain?: 'tts' | 'whisper') => {
		if (certain === 'tts') {
			const res = await updateTTSModels();
			return { ttsModels: res };
		} else if (certain === 'whisper') {
			const res = await updateWhisperModels();
			return { whisperModels: res };
		}
		const [tts, whisper] = await Promise.all([
			updateTTSModels(),
			updateWhisperModels(),
		]);

		return {
			chatModels: [],
			imageModels: [],
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
	const saveSettings = async (newVal: Record<string, DBVal>) => {
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
	const updateChatServerRunning = async () => {
		try {
			const s = settings.value;
			const usingOllama = s.selected_provider_chat === 'ollama';
			if (usingOllama) {
				const res = await fetch(urls.other.ollamaUrl('/api/version'));
				const data = await res.json();
				chatServerRunning.value = true;
				lastOllamaVersionResult.value = { ...data };
			}

			const usingKobold =
				s.selected_provider_chat === 'koboldcpp' ||
				s.selected_provider_image === 'koboldcpp' ||
				s.selected_provider_tts === 'koboldcpp' ||
				s.selected_provider_stt === 'koboldcpp';
			if (usingKobold) {
				const res = await fetch(urls.other.koboldUrl('/api/extra/version'));
				const data = await res.json();
				if (data.llm) chatServerRunning.value = true;
				else if (s.selected_provider_chat === 'koboldcpp')
					chatServerRunning.value = false;
				lastKoboldVersionResult.value = { ...data };
			}
		} catch (err: any) {
			lastKoboldVersionResult.value = {} as any;
			chatServerRunning.value = false;
		}
	};

	const intervalIdKey = 'refreshServerStatusIntervalId';
	const doRefreshServerStatus = async () => {
		try {
			await AppSettings.waitForLoaded();
			updateChatServerRunning();
		} catch (error) {
			console.error('Error refreshing server status:', error);
			if ((window as any)[intervalIdKey]) {
				clearInterval((window as any)[intervalIdKey]);
				(window as any)[intervalIdKey] = null;
			}
		}
	};

	if ((window as any)[intervalIdKey]) {
		clearInterval((window as any)[intervalIdKey]);
		(window as any)[intervalIdKey] = null;
	}

	nextTick(async () => {
		await delay(250);
		doRefreshServerStatus();
	});
	(window as any)[intervalIdKey] = setInterval(doRefreshServerStatus, 10_000);

	const imgGenerating = ref(false);
	const updateImgGenerating = (val: boolean) => {
		imgGenerating.value = val;
	};
	const imgProgress = ref(0);
	const updateImgProgress = (val: number) => {
		imgProgress.value = val;
	};

	// newHere if db is fresh or if there are no threads or buddies
	const newHere = computed(
		() =>
			settings.value.fresh_db || (!threads.value.length && !buddies.value.length)
	);

	const proceed = ref(false);

	return {
		selectedBuddyId,
		threadMessages,
		setThreadMessages,
		ttsModels,
		whisperModels,
		buddies,
		settings,
		threads,
		newHere,
		lastKoboldVersionResult,
		lastOllamaVersionResult,

		updateModels,
		updateBuddies,
		updateSettings,
		saveSettings,
		updateThreads,
		getNGpuLayers,

		proceed,

		chatServerRunning,
		updateChatServerRunning,

		imgGenerating,
		updateImgGenerating,
		imgProgress,
		updateImgProgress,

		toggleAutoStartServer: () => {
			settings.value.auto_start_server = !settings.value.auto_start_server;
		},
		toggleAutoReadChat: () => {
			settings.value.auto_read_chat = !settings.value.auto_read_chat;
		},
		toggleAutoReadSTT: () => {
			settings.value.auto_send_stt = !settings.value.auto_send_stt;
		},
	};
});
