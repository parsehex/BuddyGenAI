import type { ChatThread } from '~/server/database/knex.d';

export async function fetchThread(threadId: string): Promise<ChatThread> {
	const thread = await fetch(`/api/thread?id=${threadId}`);
	return thread.json();
}

export async function fetchThreads(): Promise<ChatThread[]> {
	const threads = await fetch('/api/threads');
	return threads.json();
}
