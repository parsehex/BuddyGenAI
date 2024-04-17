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
	return (await useFetch(url)).data as Ref<ChatMessage[]>;
}
export async function deleteAll(threadId: string) {
	const url = urls.message.deleteAll(threadId);
	return (
		await useFetch(url, {
			method: 'DELETE',
		})
	).data as Ref<DeleteResponse>;
}

export async function remove(messageId: string) {
	const url = urls.message.delete(messageId);
	return (
		await useFetch(url, {
			method: 'DELETE',
		})
	).data as Ref<DeleteResponse>;
}
export async function update(options: UpdateMessageOptions) {
	const url = urls.message.update(options.id);
	return (
		await useFetch(url, {
			method: 'PUT',
			body: JSON.stringify(options),
		})
	).data as Ref<UpdateMessageResponse>;
}
