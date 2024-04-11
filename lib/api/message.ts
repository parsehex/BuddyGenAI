import type { ChatMessage } from '@/server/database/knex.d';
import type { DeleteResponse } from './types';

interface UpdateMessageOptions {
	id: string;
	content: string;
}
interface UpdateMessageResponse {
	status: string;
	message: string;
}

// TODO add format=openai option to api?

export async function getMessages(threadId: string) {
	return (await useFetch(`/api/messages?threadId=${threadId}`)).data as Ref<ChatMessage[]>;
}
export async function deleteMessages(threadId: string) {
	return (
		await useFetch(`/api/messages?threadId=${threadId}`, {
			method: 'DELETE',
		})
	).data as Ref<DeleteResponse>;
}

export async function deleteMessage(messageId: string) {
	return (
		await useFetch(`/api/message?id=${messageId}`, {
			method: 'DELETE',
		})
	).data as Ref<DeleteResponse>;
}
export async function updateMessage(options: UpdateMessageOptions) {
	return (
		await useFetch(`/api/message`, {
			method: 'PUT',
			body: JSON.stringify(options),
		})
	).data as Ref<UpdateMessageResponse>;
}

// util:
export function apiMsgsToOpenai(messages: ChatMessage[]) {
	return messages.map((message) => ({
		id: message.id + '',
		role: message.role,
		content: message.content,
	}));
}
