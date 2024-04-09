<script setup lang="ts">
import { useChat } from 'ai/vue';
import { RefreshCcwDot } from 'lucide-vue-next';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Input } from './ui/input';
import { useAppStore } from '../stores/main';

const store = useAppStore();

const threadTitle = ref('');
const api = computed(() => `/api/message?threadId=${store.selectedThreadId}`);

const fetchMessages = async () => {
	if (!store.selectedThreadId) return;

	const res = await fetch(`/api/messages?threadId=${store.selectedThreadId}`);
	let msgs = await res.json();

	// server creates first message on thread create, don't need this now
	// if (msgs.length === 0) {
	// 	msgs = [{ id: 1, role: 'assistant', content: 'Hello! How can I help you today?' }];
	// }

	return msgs;
};
const updateThreadTitle = async () => {
	if (!store.selectedThreadId) return;
	const res = await fetch(`/api/thread?id=${store.selectedThreadId}`);
	const thread = await res.json();
	threadTitle.value = thread.name;
};

await updateThreadTitle();
const msgs = await fetchMessages();

const { messages, input, handleSubmit, setMessages, reload, isLoading } = useChat({ api: api.value, initialMessages: msgs });

const doSubmit = async (e: Event) => {
	if (input.value === '') return;
	if (isLoading.value) {
		e.preventDefault();
		console.log('prevented submit');
		return;
	}
	handleSubmit(e);
};
const doReload = async () => {
	if (isLoading.value) {
		return;
	}
	reload();
};
</script>

<template>
	<div class="flex flex-col w-full py-24 mx-auto stretch" v-if="store.selectedThreadId !== ''">
		<h2 class="text-2xl font-bold mb-4">{{ threadTitle }}</h2>
		<Card v-for="m in messages" key="m.id" class="whitespace-pre-wrap">
			<CardHeader>{{ m.role === 'user' ? 'User' : 'AI' }}</CardHeader>
			<CardContent>{{ m.content }}</CardContent>
		</Card>

		<form class="w-full fixed bottom-0 flex gap-1.5">
			<Input class="p-2 mb-8 border border-gray-300 rounded shadow-xl" v-model="input" placeholder="Say something..." @keydown.enter="doSubmit" />
			<Button type="button" size="sm" @click="doSubmit">Send</Button>
			<Button type="button" size="sm" @click="doReload"><RefreshCcwDot /> </Button>
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
