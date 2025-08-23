import { ref, computed } from 'vue';
import type { ChatMessage } from '@/lib/api/types-db';
import { v4 } from 'uuid';
import { AppSettings } from '@/lib/api/AppSettings';
import { useAppStore } from '../stores/main';
import { useChatAI, type ChatRequest } from './ai/useChatAI';
import { popError } from '../lib/utils';

interface UseChatOptions {
	initialMessages?: ChatMessage[];
	body?: Record<string, unknown>;
	onFinish?: (messages: ChatMessage[]) => void;
	onError?: (error: Error) => void;
}

export default function useChat(options: UseChatOptions) {
	const headers = ref({
		'Content-Type': 'application/json',
		'HTTP-Referer': 'https://buddygenai.com/',
		'X-Title': 'buddyGenAI',
	} as Record<string, any>);

	const store = useAppStore();
	const chatAI = useChatAI();
	const messages = ref([] as ChatMessage[]);
	const input = ref('');
	const isLoading = ref(false);

	function setAPIKeyHeader() {
		const key = AppSettings.get('openrouter_api_key') as string;
		if (!key || key === 'demo') return;
		headers.value['Authorization'] = 'Bearer ' + key;
	}

	async function handleSubmit(e?: Event, skipUserMsg = false) {
		setAPIKeyHeader();
		if (
			store.settings.selected_provider_chat === 'openrouter' &&
			!headers.value['Authorization']
		) {
			// TODO
			popError('Must connect OpenRouter account');
			return;
		}

		// construct message obj, add to messages
		if (!skipUserMsg) {
			const userMsg = {
				id: v4(),
				role: 'user',
				content: input.value,
			};
			messages.value.push(userMsg as ChatMessage);
		}

		// clear input
		input.value = '';
		if (e) e.preventDefault();

		const messagesToSend = JSON.parse(JSON.stringify(messages.value));
		isLoading.value = true;
		const thread_index = messages.value.length;
		// send new messages to server, create assistant message
		const msg = ref({
			created: Date.now(),
			updated: null,
			id: v4(),
			role: 'assistant',
			content: '',
			image: null,
			tts: null,
			thread_id: '',
			thread_index,
		} as ChatMessage);
		messages.value.push(msg.value);

		const stream = store.settings.chat_streaming;
		const req: ChatRequest = {
			...options.body,
			messages: messagesToSend,
			stream,
			stream_callback: (s: string) => {
				msg.value.content = s;
			},
		};
		try {
			const response = await chatAI.chat(req);
			msg.value.content = response || '';
		} catch (err: any) {
			if (err.name === 'CanceledError' || err.name === 'AbortError') {
				console.log('Request was cancelled.');
				return;
			}
			console.error('Request failed:', err);
		}
		if (options.onFinish) {
			options.onFinish(messages.value);
		}
		isLoading.value = false;
	}

	function setMessages(newMessages: ChatMessage[]) {
		messages.value = newMessages;
	}

	async function reload() {
		messages.value.pop();
		await handleSubmit(new Event('reload'), true);
	}

	function append(message: ChatMessage) {
		// add message and submit
		messages.value.push(message);
		handleSubmit(new Event('append'), true);
	}

	if (options.initialMessages) {
		setMessages(options.initialMessages);
	}

	return {
		messages: computed(() => messages.value),
		input,
		handleSubmit,
		setMessages,
		reload,
		isLoading,
		stop: chatAI.stop,
		append,
	};
}
