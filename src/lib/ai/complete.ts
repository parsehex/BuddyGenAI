import { AppSettings } from '../api/AppSettings';
import type { ChatMessage } from '../api/types-db';
import urls from '../api/urls';
import { MODEL_NAME } from '../constants';
import { chat } from './webllm';

export async function complete(
	prompt: string,
	options: {
		body: { temperature?: number; max_tokens?: number; messages?: ChatMessage[] };
	} = { body: {} }
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

	const isWebLLM = AppSettings.get('selected_provider_chat') === 'webllm';
	if (isWebLLM) {
		const response = await chat(options.body);
		return response;
	}

	const key = AppSettings.get('openrouter_api_key') as string;
	const response = await fetch(await urls.other.llamacppServerUrl(), {
		method: 'POST',
		headers: {
			Authorization: 'Bearer ' + key,
			'Content-Type': 'application/json',
			'HTTP-Referer': 'https://buddygenai.com/',
			'X-TITLE': 'BuddyGenAI',
		},
		body: JSON.stringify({
			...options.body,
			model: MODEL_NAME,
		}),
	});
	// return await response.text();
	const res = await response.json();
	// console.log(res);
	return res.choices[0].message.content;
}
