import type { ChatMessage, ChatThread } from '@/server/database/types';
import type { DeleteResponse } from '../types';
import urls from '../urls';

export async function getAll() {
	const url = urls.thread.getAll();
	return (await useFetch(url)).data as Ref<ChatThread[]>;
}
export async function getAllByPersona(personaId: string) {
	const url = urls.thread.getAllByPersona(personaId);
	return (await useFetch(url)).data as Ref<ChatThread[]>;
}
export async function get(threadId: string) {
	if (!threadId) {
		console.error('No threadId provided, expect errors');
	}
	const url = urls.thread.get(threadId);
	return (await useFetch(url)).data as Ref<ChatThread>;
}
interface CreateThreadOptions {
	name: string;
	persona_id?: number;
	mode: 'custom' | 'persona';
}
export async function create(thread: CreateThreadOptions) {
	const url = urls.thread.create();
	return (
		await useFetch(url, {
			method: 'POST',
			body: JSON.stringify(thread),
		})
	).data as Ref<ChatThread>;
}
interface UpdateThreadOptions extends Partial<CreateThreadOptions> {
	id: string;
}
export async function update(thread: UpdateThreadOptions) {
	const url = urls.thread.update(thread.id);
	return (
		await useFetch(url, {
			method: 'PUT',
			body: JSON.stringify(thread),
		})
	).data as Ref<ChatThread>;
}
export async function remove(threadId: string) {
	const url = urls.thread.delete(threadId);
	return (
		await useFetch(url, {
			method: 'DELETE',
		})
	).data as Ref<DeleteResponse>;
}

export async function updateSystemMessage(threadId: string) {
	const url = urls.thread.updateSystemMessage(threadId);
	return (
		await useFetch(url, {
			method: 'POST',
		})
	).data as Ref<ChatMessage>;
}
