import { AppSettings } from '../api/AppSettings';
import type { ChatMessage } from '../api/types-db';

export function titleFromMessages(
	msg1: ChatMessage,
	msg2: ChatMessage,
	msg3: ChatMessage
) {
	const prompt = `Your task is to write a title in 5 words or less for the following chat. When in doubt, write a generic title.
Context:
\`\`\`
\`${msg1.role}\`: ${msg1.content}\n
\`${msg2.role}\`: ${msg2.content}\n
\`${msg3.role}\`: ${msg3.content}\n
\`\`\`

Respond with a valid JSON object containing the "title" key with a string value.`;
	return prompt;
}

export function defaultAIChatPrompt(userName: string) {
	if (userName) userName = userName.trim();

	const chatImages = AppSettings.get('chat_image_enabled') as string | number;
	const chatImagesEnabled =
		chatImages &&
		(chatImages === '1.0' || chatImages === '1' || chatImages === 1);
	// TODO the below wont update existing threads if setting changes

	const prompt = `The following is a chat between a user${
		userName && userName !== 'user' ? ' named ' + userName : ''
	} and an AI Assistant.${
		chatImagesEnabled
			? ' Assistant has the ability to send pictures (1 per reply), which can be sent immediately.'
			: ''
	}`;
	return prompt;
}
