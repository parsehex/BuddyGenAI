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
		await fetch('/api/thread', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ name: newThreadName.value, mode: 'custom' }),
		});
		newThreadName.value = '';

		const threadsRes = await fetch('/api/threads');
		threads.value = await threadsRes.json();
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
	<Tabs default-value="threads">
		<TabsList>
			<TabsTrigger value="threads">Threads</TabsTrigger>
			<TabsTrigger value="personas">Personas</TabsTrigger>
		</TabsList>
		<TabsContent value="threads">
			<div class="sidebar">
				<div class="flex w-full mb-4">
					<!-- mb-4 = margin-bottom: 4px -->
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
			<!--  -->
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
