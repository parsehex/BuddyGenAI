import { defineStore } from 'pinia';
import type {
	ChatMessage,
	ChatThread,
	PersonaVersionMerged,
} from '~/server/database/types';

import uF from '~/lib/api/useFetch';
import $f from '~/lib/api/$fetch';

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

export const useAppStore = defineStore('app', () => {
	const route = useRoute();

	const selectedPersonaId = ref<string>('');
	const threadMessages = ref<ChatMessage[]>([]);

	const chatModels = ref([] as string[]);
	const imageModels = ref([] as string[]);
	const personas = ref([] as PersonaVersionMerged[]);
	const settings = ref({} as Settings);
	const threads = ref([] as ChatThread[]);
	const chatServerRunning = ref(false);

	onBeforeMount(async () => {
		const cM = await $f.model.get('chat');
		const iM = await $f.model.get('image');
		const p = await $f.persona.getAll();
		const s = (await $f.setting.getAll()) as unknown;
		const t = await $f.thread.getAll();
		chatModels.value.length = 0;
		chatModels.value.push(...cM);
		imageModels.value.length = 0;
		imageModels.value.push(...iM);
		personas.value.length = 0;
		personas.value.push(...p);
		Object.assign(settings.value, s);
		threads.value.length = 0;
		threads.value.push(...t);
	});

	const startServer = async () => {
		if (chatServerRunning.value) return;
		await $fetch('/api/llama.cpp/start', { method: 'POST' });
		chatServerRunning.value = true;
	};
	const stopServer = async () => {
		await $fetch('/api/llama.cpp/stop', { method: 'POST' });
	};
	const refreshServerStatus = async () => {
		const status = await $fetch('/api/llama.cpp/status', { method: 'GET' });
		if (!status) return false;
		const { isRunning } = status;
		chatServerRunning.value = isRunning;
	};

	const updateChatModels = async () => {
		const res = await $f.model.get('chat');
		chatModels.value.length = 0;
		chatModels.value.push(...res);
	};
	const updateImageModels = async () => {
		const res = await $f.model.get('image');
		imageModels.value.length = 0;
		imageModels.value.push(...res);
	};
	const updateModels = async () => {
		await updateChatModels();
		await updateImageModels();

		console.log('updated models', chatModels.value, imageModels.value);
		return { chatModels: chatModels.value, imageModels: imageModels.value };
	};
	const updatePersonas = async () => {
		const res = await $f.persona.getAll();
		personas.value.length = 0;
		personas.value.push(...res);
		return res;
	};
	const updateSettings = async () => {
		const res = (await $f.setting.getAll()) as unknown;
		Object.assign(settings.value, res);
		return res;
	};
	const saveSettings = async (newVal: Record<string, string>) => {
		await $f.setting.update(newVal);
	};
	const updateThreads = async () => {
		const res = await $f.thread.getAll();
		threads.value.length = 0;
		threads.value.push(...res);
		return res;
	};

	watch(route, async (newVal) => {
		// if we're on a chat thread, get its messages
		if (newVal.path.includes('chat')) {
			const threadId = newVal.params.id as string;
			const res = await $f.message.getAll(threadId);
			threadMessages.value.length = 0;
			threadMessages.value.push(...res);
		}
	});

	watch(settings.value, async (newVal) => {
		// console.log(settings.value, newVal);
		// if (newVal.lastOpened === undefined) {
		// 	settings.value.lastOpened = new Date().toISOString();
		// 	await saveSettings('$f');
		// }
		// await saveSettings('$f');
		// await updateSettings('$f');

		await saveSettings(newVal);
		await updateSettings();
	});

	return {
		selectedPersonaId,
		threadMessages,
		chatServerRunning,
		chatModels,
		imageModels,
		personas,
		settings,
		threads,

		updateModels,
		updatePersonas,
		updateSettings,
		saveSettings,
		updateThreads,

		startServer,
		stopServer,
		refreshServerStatus,
	};
});

function isRef<T>(val: any): val is Ref<T> {
	if (val === null || typeof val !== 'object') return false;
	if (val.value === undefined) return false;
	return true;
	// return val && val.__v_isRef === true;
}
