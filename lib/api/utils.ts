import type { ChatMessage } from '~/server/database/types';

export function apiMsgsToOpenai(messages: ChatMessage[]) {
	return messages.map((message) => ({
		id: message.id,
		role: message.role,
		content: message.content,
	}));
}
