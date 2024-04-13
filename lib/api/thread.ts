import type { ChatThread } from '@/server/database/types';
import type { DeleteResponse } from './types';

export async function getThreads() {
	return (await useFetch('/api/threads')).data as Ref<ChatThread[]>;
}
export async function getThreadsByPersona(personaId: string) {
	return (await useFetch(`/api/threads?personaId=${personaId}`)).data as Ref<ChatThread[]>;
}
export async function getThread(threadId: string) {
	if (!threadId) {
		console.error('No threadId provided, expect errors');
	}
	return (await useFetch(`/api/thread?id=${threadId}`)).data as Ref<ChatThread>;
}
interface CreateThreadOptions {
	name: string;
	persona_id?: number;
	mode: 'custom' | 'persona';
}
export async function createThread(thread: CreateThreadOptions) {
	return (
		await useFetch('/api/thread', {
			method: 'POST',
			body: JSON.stringify(thread),
		})
	).data as Ref<ChatThread>;
}
interface UpdateThreadOptions extends Partial<CreateThreadOptions> {
	id: string;
}
export async function updateThread(thread: UpdateThreadOptions) {
	return (
		await useFetch('/api/thread', {
			method: 'PUT',
			body: JSON.stringify(thread),
		})
	).data as Ref<ChatThread>;
}
export async function deleteThread(threadId: string) {
	return (
		await useFetch(`/api/thread?id=${threadId}`, {
			method: 'DELETE',
		})
	).data as Ref<DeleteResponse>;
}
