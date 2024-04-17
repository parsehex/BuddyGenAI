import type { ChatMessage } from '@/server/database/types';
import type { DeleteResponse } from '../types';
import urls from '../urls';

interface UpdateMessageOptions {
	id: string;
	content: string;
}
interface UpdateMessageResponse {
	status: string;
	message: string;
}

// TODO add format=openai option to api?

export async function getAll(threadId: string) {
	const url = urls.message.getAll(threadId);
	return (await $fetch(url)) as ChatMessage[];
}
export async function removeAll(threadId: string) {
	const url = urls.message.deleteAll(threadId);
	return (await $fetch(url, { method: 'DELETE' })) as DeleteResponse;
}

export async function remove(messageId: string) {
	const url = urls.message.delete(messageId);
	return (await $fetch(url, { method: 'DELETE' })) as DeleteResponse;
}
export async function update(options: UpdateMessageOptions) {
	const url = urls.message.update(options.id);
	return (await $fetch(url, {
		method: 'PUT',
		body: JSON.stringify(options),
	})) as UpdateMessageResponse;
}
