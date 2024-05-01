import { defineStore } from 'pinia';
import type {
	ChatMessage,
	ChatThread,
	MergedChatThread,
	BuddyVersionMerged,
} from '@/lib/api/types-db';

import api from '@/lib/api/db';
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
	const saveSettings = async (newVal: Record<string, string>) => {
		await api.setting.update(newVal);
	};
	const updateThreads = async () => {
		const res = await api.thread.getAll();
		if (!res) return [];
		threads.value.length = 0;
		threads.value.push(...res);
		return res;
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
		const running = await isServerRunning();
		chatServerRunning.value = running;
	};

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
		getChatModelPath,

		startServer,
		stopServer,
		isExternalProvider,

		chatServerRunning,
		updateChatServerRunning,
	};
});
