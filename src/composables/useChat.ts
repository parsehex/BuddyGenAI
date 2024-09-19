import type { Chat, ChatCompletionMessage } from 'openai/resources/index';
import { ref, computed } from 'vue';
import type {
	ChatThread,
	MergedChatThread,
	BuddyVersionMerged,
	ChatMessage,
} from '@/lib/api/types-db';
import axios from 'axios';
import { v4 } from 'uuid';
import urls from '@/lib/api/urls';

interface UseChatOptions {
	initialMessages?: ChatMessage[];
	body?: Record<string, unknown>;
	onFinish?: (messages: ChatMessage[]) => void;
	onError?: (error: Error) => void;
}

export default function useChat(options: UseChatOptions) {
	const BaseUrl = ref('');

	const messages = ref([] as ChatMessage[]);
	const input = ref('');
	const isLoading = ref(false);

	const controller = new AbortController();

	async function handleSubmit(e: Event, skipUserMsg = false) {
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
		e.preventDefault();

		isLoading.value = true;
		// send new messages to server, create assistant message
		let i = 0;
		const msg = ref({
			created: Date.now(),
			updated: null,
			id: v4(),
			role: 'assistant',
			content: '',
			image: null,
			tts: null,
			thread_id: '',
			thread_index: 0,
		} as ChatMessage);
		messages.value.push(msg.value);
		await axios({
			url: BaseUrl.value,
			method: 'post',
			headers: {
				'Content-Type': 'application/json',
			},
			signal: controller.signal,
			data: { ...options.body, messages: messages.value, stream: true },
			onDownloadProgress: (progressEvent) => {
				const xhr = progressEvent.event.target;
				const { responseText } = xhr;
				// responseText contains all chunks so far
				const chunks = responseText.split('data:').map((c: string) => c.trim());
				let content = '';
				let isLast = false;
				for (const chunkStr of chunks) {
					if (!chunkStr) continue;
					if (chunkStr.trim() === '[DONE]') {
						isLast = true;
						break;
					}

					const chunk = JSON.parse(chunkStr);
					content += chunk.choices[0].delta.content || '';

					// does chunk have `usage` object?
					if (chunk.usage) {
						isLast = true;
					}
				}
				msg.value.content = content;

				if (isLast) {
					isLoading.value = false;
					if (options.onFinish) {
						options.onFinish(messages.value);
					}
				}

				i++;
			},
		});
	}

	function setMessages(newMessages: ChatMessage[]) {
		messages.value = newMessages;
	}

	async function reload() {
		messages.value.pop();
		await handleSubmit(new Event('reload'), true);
	}

	function stop() {
		// TODO need to test this
		controller.abort();
	}

	function append(message: ChatMessage) {
		// add message and submit
		messages.value.push(message);
		handleSubmit(new Event('append'), true);
	}

	if (options.initialMessages) {
		setMessages(options.initialMessages);
	}
	(async () => {
		BaseUrl.value = (await urls.other.llamacppServerUrl()) + '/api/complete';
	})();

	return {
		messages: computed(() => messages.value),
		input,
		handleSubmit,
		setMessages,
		reload,
		isLoading,
		stop,
		append,
	};
}
