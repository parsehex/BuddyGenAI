<script setup lang="ts">
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useAppStore } from '../stores/main';

const store = useAppStore();

const threadsRes = await fetch('/api/threads');
let threads = ref(await threadsRes.json());

const newThreadName = ref('');

const emit = defineEmits(['selectThread', 'createThread', 'deleteThread']);

const selectThread = (threadId: string) => {
	store.selectedThreadId = threadId;
	emit('selectThread', threadId);
};

const createThread = async () => {
	if (newThreadName.value) {
		const newThreadRes = await fetch('/api/thread', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ name: newThreadName.value, mode: 'custom' }),
		});
		const newThread = await newThreadRes.json();
		newThreadName.value = '';

		const threadsRes = await fetch('/api/threads');
		threads.value = await threadsRes.json();

		selectThread(newThread.id);
	}
};

const deleteThread = async (threadId: string) => {
	await fetch(`/api/thread?id=${threadId}`, {
		method: 'DELETE',
	});

	const threadsRes = await fetch('/api/threads');
	threads.value = await threadsRes.json();

	if (store.selectedThreadId === threadId) {
		store.selectedThreadId = '';
	}
};
</script>

<template>
	<div class="sidebar">
		<div class="flex w-full mb-4">
			<Input v-model="newThreadName" placeholder="Thread name" @keyup.enter="createThread" />
			<Button @click="createThread">+</Button>
		</div>
		<ul>
			<li
				v-for="thread in threads"
				:key="thread.id"
				@click="selectThread(thread.id)"
				@contextmenu.prevent="deleteThread(thread.id)"
				:class="['cursor-pointer', 'hover:bg-gray-200', 'p-1', 'rounded', store.selectedThreadId === thread.id ? 'font-bold' : '']"
			>
				{{ thread.name }}
			</li>
		</ul>
	</div>
</template>
