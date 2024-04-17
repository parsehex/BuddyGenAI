import type { ChatMessage, ChatThread } from '@/server/database/types';
import type { DeleteResponse } from '../types';
import urls from '../urls';

export async function getAll() {
	const url = urls.thread.getAll();
	return (await $fetch(url)) as ChatThread[];
}
export async function getAllByPersona(personaId: string) {
	const url = urls.thread.getAllByPersona(personaId);
	return (await $fetch(url)) as ChatThread[];
}
export async function get(threadId: string) {
	if (!threadId) {
		console.error('No threadId provided, expect errors');
	}
	const url = urls.thread.get(threadId);
	return (await $fetch(url)) as ChatThread;
}
interface CreateThreadOptions {
	name: string;
	persona_id?: string;
	mode: 'custom' | 'persona';
	persona_mode_use_current?: boolean;
}
export async function create(thread: CreateThreadOptions) {
	const url = urls.thread.create();
	return (await $fetch(url, {
		method: 'POST',
		body: JSON.stringify(thread),
	})) as ChatThread;
}
interface UpdateThreadOptions extends Partial<CreateThreadOptions> {
	id: string;
}
export async function update(thread: UpdateThreadOptions) {
	const url = urls.thread.update(thread.id);
	return (await $fetch(url, {
		method: 'PUT',
		body: JSON.stringify(thread),
	})) as ChatThread;
}
export async function remove(threadId: string) {
	const url = urls.thread.delete(threadId);
	return (await $fetch(url, {
		method: 'DELETE',
	})) as DeleteResponse;
}

export async function updateSystemMessage(threadId: string) {
	const url = urls.thread.updateSystemMessage(threadId);
	return (await $fetch(url, {
		method: 'POST',
	})) as ChatMessage;
}
