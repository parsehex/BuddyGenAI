import { ref, computed } from 'vue';
import type { ChatMessage } from '@/lib/api/types-db';
import { v4 } from 'uuid';
import { AppSettings } from '@/lib/api/AppSettings';
import { useAppStore } from '../stores/main';
import { useChatAI, type ChatRequest } from './ai/useChatAI';
import { popError } from '../lib/utils';
import { parse } from 'partial-json';

interface UseChatOptions {
	aiName: string;
	initialMessages?: ChatMessage[];
	/**
	 * If set, then:
	 * 1) Sets `json: true` for the LLM requests
	 * 2) On each returned chunk, parses the message as partial json and set the message value to the value of `partialJsonKey`
	 * You should still prompt model to return JSON in expected format. The `onFinish` callback will return the full json response.
	 */
	partialJsonKey?: string;
	body?: Record<string, unknown>;
	onFinish?: (messages: ChatMessage[], response: string) => void;
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
		const json = !!options.partialJsonKey;
		const req: ChatRequest = {
			...options.body,
			messages: messagesToSend,
			stream,
			json,
			stream_callback: (s: string) => {
				if (!options.partialJsonKey) {
					msg.value.content = s;
					return;
				}
				let parsed = parse(s);
				if (!parsed) return;
				if (Array.isArray(parsed) && parsed.length > 0) parsed = parsed[0];
				msg.value.content = parsed[options.partialJsonKey];
			},
		};
		let wholeResponse = ';';
		let formatPrompt = `\n\nRespond with valid JSON containing the key "message" with a string value containing the response`;

		const chatImages = AppSettings.get('chat_image_enabled') as string | number;
		const chatImagesEnabled =
			chatImages && chatImages !== '0.0' && chatImages !== '0' && chatImages !== 0;
		if (chatImagesEnabled) {
			formatPrompt += ` and an optional key "send_image" with a boolean value indicating whether ${options.aiName} decides to send an image to the user based contextually on the current chat`;
		}
		formatPrompt += '.';
		if (options.partialJsonKey) req.messages[0].content += formatPrompt;
		try {
			let response = await chatAI.chat(req);
			wholeResponse = response as string;
			try {
				if (options.partialJsonKey && response) {
					let data = JSON.parse(response);
					// @ts-ignore
					if (Array.isArray(data) && data.length > 0) data = data[0];
					response = data[options.partialJsonKey];
				}
			} catch (e) {}
			msg.value.content = response || '';
		} catch (err: any) {
			if (err.name === 'CanceledError' || err.name === 'AbortError') {
				console.log('Request was cancelled.');
				return;
			}
			console.error('Request failed:', err);
		}
		if (options.onFinish) {
			options.onFinish(messages.value, wholeResponse);
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
