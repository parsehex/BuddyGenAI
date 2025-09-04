import { useChatAI } from '@/src/composables/ai/useChatAI';
import type { ChatMessage } from '../api/types-db';

export async function complete(
	prompt: string,
	options: {
		body: { temperature?: number; max_tokens?: number; messages?: ChatMessage[] };
	} = { body: {} },
	json = false
) {
	// if there is a prompt and messages, set first message to prompt
	if (prompt && options.body.messages) {
		options.body.messages[0].content = prompt;
	}

	// only a prompt? add as new user message
	if (prompt && !options.body.messages) {
		options.body.messages = [{ content: prompt, role: 'user' } as ChatMessage];
	}

	if (!prompt && !options.body.messages)
		throw new Error('Tried to complete nothing');

	const res = await useChatAI().chat({
		...options.body,
		messages: options.body.messages as ChatMessage[],
		json,
	});
	if (typeof res === 'undefined')
		throw new Error('Received undefined response from chat AI');
	return res;
}
