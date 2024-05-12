import { defineStore } from 'pinia';
import type {
	ChatMessage,
	ChatThread,
	MergedChatThread,
	BuddyVersionMerged,
	SQLiteVal,
} from '@/lib/api/types-db';

import { api } from '@/lib/api';
import useLlamaCpp from '@/composables/useLlamaCpp';
import urls from '~/lib/api/urls';
import axios from 'axios';

// @ts-ignore
const { startServer, stopServer, isServerRunning } = useLlamaCpp();

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
	external_api_key: string;
	fresh_db: number;
	n_gpu_layers: number;
	auto_start_server: number;
}

let firstRun = true;
export const useAppStore = defineStore('app', () => {
	const route = useRoute();

	const selectedBuddyId = ref<string>('');
	const threadMessages = ref<ChatMessage[]>([]);

	const chatModels = ref([] as string[]);
	const imageModels = ref([] as string[]);
	const buddies = ref([] as BuddyVersionMerged[]);
	const settings = ref({} as Settings);
	const threads = ref([] as MergedChatThread[]);

	const isExternalProvider = computed(
		() => settings.value.selected_provider_chat === 'external'
	);

	onBeforeMount(async () => {
		const [cM, iM, p, s, t] = await Promise.all([
			api.model.getAll('chat'),
			api.model.getAll('image'),
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
	const updateModels = async () => {
		const [chat, image] = await Promise.all([
			updateChatModels(),
			updateImageModels(),
		]);

		return { chatModels: chat, imageModels: image };
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
		if (!settings.value.local_model_directory) return;
		if (!settings.value.selected_model_chat) return;
		const slash = settings.value.local_model_directory.includes('\\')
			? '\\'
			: '/';
		return `${settings.value.local_model_directory}${slash}chat${slash}${settings.value.selected_model_chat}`;
	};

	watch(route, async (newVal) => {
		// if we're on a chat thread, get its messages
		if (newVal.path.includes('chat')) {
			const threadId = newVal.params.id as string;
			const res = await api.message.getAll(threadId);
			if (!res) return;
			threadMessages.value.length = 0;
			threadMessages.value.push(...res);
		}
	});

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
		const eventSource = new EventSource('http://localhost:8079/api/sd/progress');

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

	return {
		selectedBuddyId,
		threadMessages,
		chatModels,
		imageModels,
		buddies,
		settings,
		threads,

		updateModels,
		updateBuddies,
		updateSettings,
		saveSettings,
		updateThreads,
		getNGpuLayers,
		getChatModelPath,

		startServer,
		stopServer,
		isExternalProvider,

		chatServerRunning,
		updateChatServerRunning,

		imgGenerating,
		updateImgGenerating,
		imgProgress,
		updateImgProgress,

		toggleAutoStartServer: () => {
			settings.value.auto_start_server = settings.value.auto_start_server ? 0 : 1;
		},
	};
});
