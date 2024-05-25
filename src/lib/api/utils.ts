import type { ChatMessage } from '@/lib/api/types-db';

export function apiMsgsToOpenai(messages: ChatMessage[]) {
	return messages.map((message) => ({
		id: message.id,
		role: message.role,
		content: message.content,
		image: message.image,
		tts: message.tts,
	}));
}
