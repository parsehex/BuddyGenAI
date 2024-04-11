<script setup lang="ts">
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from './ui/context-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { Input } from './ui/input';
import { Button } from './ui/button';
import { useAppStore } from '../stores/main';

const store = useAppStore();

const threadsRes = await fetch('/api/threads');
let threads = ref(await threadsRes.json());

const newThreadName = ref('');

const editingThreadName = ref('');

const renameClicked = (threadId: string) => {
	editingThreadName.value = threads.value.find((thread: any) => thread.id === threadId).name;
};
const handleRename = async () => {
	if (editingThreadName.value) {
		const newThreadRes = await fetch('/api/thread', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ id: store.selectedThreadId, name: editingThreadName.value }),
		});
		const newThread = await newThreadRes.json();
		editingThreadName.value = '';

		const threadsRes = await fetch('/api/threads');
		threads.value = await threadsRes.json();
	}
};

const selectThread = (threadId: string) => {
	store.selectedThreadId = threadId;
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
			<Dialog>
				<ContextMenu>
					<ContextMenuTrigger>
						<li
							v-for="thread in threads"
							:key="thread.id"
							@click="selectThread(thread.id)"
							:class="['cursor-pointer', 'hover:bg-gray-200', 'p-1', 'rounded', store.selectedThreadId === thread.id ? 'font-bold' : '']"
						>
							{{ thread.name }}
						</li>
					</ContextMenuTrigger>
					<ContextMenuContent>
						<!-- TODO fix to not use selected thread -->
						<DialogTrigger asChild>
							<ContextMenuItem>
								<span @click="renameClicked(store.selectedThreadId)">Rename</span>
							</ContextMenuItem>
						</DialogTrigger>
						<ContextMenuItem @click="deleteThread(store.selectedThreadId)">Delete</ContextMenuItem>
					</ContextMenuContent>
				</ContextMenu>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>New Name</DialogTitle>
					</DialogHeader>
					<DialogDescription>
						<Input v-model="editingThreadName" placeholder="Thread name" />
					</DialogDescription>
					<DialogFooter>
						<DialogClose as-child>
							<Button @click="handleRename" type="button">Confirm</Button>
						</DialogClose>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</ul>
	</div>
</template>
