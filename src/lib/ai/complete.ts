import type { ChatMessage } from '../api/types-db';
import urls from '../api/urls';

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

	const response = await fetch(
		(await urls.other.llamacppServerUrl()) + '/api/completion',
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				// prompt,
				...options.body,
			}),
		}
	);
	// return await response.text();
	const res = await response.json();
	console.log(res);
	return res.choices[0].message.content;
}
