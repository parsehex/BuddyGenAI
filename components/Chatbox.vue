<script setup lang="ts">
import { useChat } from 'ai/vue';
import { RefreshCcwDot } from 'lucide-vue-next';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Input } from './ui/input';
import { useAppStore } from '../stores/main';

const store = useAppStore();
console.log(store);

const initMsgs = ref([] as any[]); // TODO

const threadTitle = ref('');

const fetchThreads = async () => {
	const res = await fetch('/api/threads');
	const threads = await res.json();
	return threads;
};

const fetchMessages = async () => {
	if (!store.selectedThreadId) return;

	const res = await fetch(`/api/messages?threadId=${store.selectedThreadId}`);
	initMsgs.value = await res.json();

	if (initMsgs.value.length === 0) {
		initMsgs.value = [{ id: 1, role: 'assistant', content: 'Hello! How can I help you today?' }];
	}
};
const updateThreadTitle = async () => {
	if (!store.selectedThreadId) return;
	const res = await fetch(`/api/thread?id=${store.selectedThreadId}`);
	const thread = await res.json();
	console.log(thread);
	threadTitle.value = thread.name;
};

const { messages, input, handleSubmit, setMessages, reload } = useChat({ api: `/api/message?threadId=${store.selectedThreadId}`, initialMessages: initMsgs.value });

await fetchMessages();
await updateThreadTitle();
watch(
	() => store.selectedThreadId,
	async () => {
		await fetchMessages();
		await updateThreadTitle();
		setMessages(initMsgs.value);
	}
);

if (store.selectedThreadId === '') {
	const threads = await fetchThreads();
	if (threads.length > 0) {
		store.selectedThreadId = threads[0].id;
	}
}
</script>

<template>
	<div class="flex flex-col w-full py-24 mx-auto stretch" v-if="store.selectedThreadId !== ''">
		<h2 class="text-2xl font-bold mb-4">{{ threadTitle }}</h2>
		<Card v-for="m in messages" key="m.id" class="whitespace-pre-wrap">
			<CardHeader>{{ m.role === 'user' ? 'User' : 'AI' }}</CardHeader>
			<CardContent>{{ m.content }}</CardContent>
		</Card>

		<form @submit="handleSubmit" class="w-full fixed bottom-0 flex gap-1.5">
			<Input class="p-2 mb-8 border border-gray-300 rounded shadow-xl" v-model="input" placeholder="Say something..." />
			<!-- <RefreshCcwDot /> -->
			<Button size="sm" @click="reload"><RefreshCcwDot /> </Button>
		</form>
	</div>
</template>

<style lang="scss" scoped>
form {
	align-items: normal;
}
div,
form,
div > form > input {
	max-width: 40rem;
}
</style>
