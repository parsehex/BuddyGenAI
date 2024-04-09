<script setup lang="ts">
// TODO add Persona tab
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
	<Tabs default-value="threads" class="fixed">
		<TabsList class="w-full">
			<TabsTrigger value="threads">Threads</TabsTrigger>
			<TabsTrigger value="personas">Personas</TabsTrigger>
		</TabsList>
		<TabsContent value="threads">
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
		</TabsContent>
		<TabsContent value="personas">
			<div class="sidebar">
				<div class="flex w-full mb-4">
					<Input placeholder="Persona name" />
					<Button>+</Button>
				</div>
				<ul>
					<li :class="['cursor-pointer', 'hover:bg-gray-200', 'p-1', 'rounded']"> Persona Name </li>
				</ul>
			</div>
		</TabsContent>
	</Tabs>
</template>

<style scoped>
.sidebar {
	width: 200px;
	height: 100vh;
	background-color: #f5f5f5;
	padding: 20px;
}

.sidebar ul {
	list-style-type: none;
	padding: 0;
}

.sidebar a {
	text-decoration: none;
	color: #333;
}
</style>
