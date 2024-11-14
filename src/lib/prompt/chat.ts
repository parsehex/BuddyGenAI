import type { Message } from 'ai';
import appConfig from '@/src/composables/useConfig';

export function titleFromMessages(msg1: Message, msg2: Message, msg3: Message) {
	const prompt = `Your task is to write a title in 5 words or less for the following chat. When in doubt, write a generic title.\n\nContext: ${msg1.content}\n\n${msg2.role}: ${msg2.content}\n\n${msg3.role}: ${msg3.content}`;
	return prompt;
}

export function defaultAIChatPrompt(userName: string) {
	if (userName) userName = userName.trim();

	const chatImagesEnabled = appConfig?.config.value.chat_image_enabled;
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
