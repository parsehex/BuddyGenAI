<script setup lang="ts">
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from './ui/context-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getThread, getThreads, createThread, updateThread, deleteThread } from '@/lib/api/thread';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useAppStore } from '../stores/main';
import type { ChatThread } from '~/server/database/knex.d';

const route = useRoute();
const isThreadSelected = (threadId: string | number) => route.path.includes(`/chat`) && route.params.id == threadId;

const store = useAppStore();

const newThreadName = ref('');
const editingThreadName = ref('');

const threads = ref([] as ChatThread[]);

onBeforeMount(async () => {
	threads.value = (await getThreads()).value;
});

const renameClicked = (threadId: string) => {
	const thread = threads.value.find((thread: any) => thread.id === threadId);
	if (thread) {
		editingThreadName.value = thread.name;
	} else {
		console.error(`Couldn't find thread with id ${threadId} to rename`);
		editingThreadName.value = '';
	}
};
const handleRename = async () => {
	if (editingThreadName.value) {
		await updateThread({
			id: store.selectedThreadId,
			name: editingThreadName.value,
		});
		editingThreadName.value = '';

		const threads = await getThreads();
		threads.value = threads.value;
	}
};

const doCreateThread = async () => {
	if (newThreadName.value) {
		const { value: newThread } = await createThread({
			name: newThreadName.value,
			mode: 'custom',
		});

		threads.value = (await getThreads()).value;
		navigateTo(`/chat/${newThread.id}`);
	}
};

const doDeleteThread = async (threadId: string) => {
	await deleteThread(threadId);

	threads.value = (await getThreads()).value;

	if (isThreadSelected(threadId)) {
		navigateTo(`/chat/${threads.value[0].id}`);
	}
};
</script>

<template>
	<div class="sidebar">
		<div class="flex w-full mb-4">
			<Input v-model="newThreadName" placeholder="Thread name" @keyup.enter="createThread" />
			<Button @click="doCreateThread">+</Button>
		</div>
		<ul>
			<Dialog>
				<ContextMenu>
					<ContextMenuTrigger>
						<li v-for="thread in threads" :key="thread.id" :class="['cursor-pointer', 'hover:bg-gray-200', 'p-1', 'rounded', isThreadSelected(thread.id) ? 'font-bold bg-gray-200' : '']">
							<NuxtLink :to="`/chat/${thread.id}`" class="block p-1">
								{{ thread.name }}
							</NuxtLink>
						</li>
					</ContextMenuTrigger>
					<ContextMenuContent>
						<!-- TODO fix to not use selected thread -->
						<DialogTrigger asChild>
							<ContextMenuItem>
								<span @click="renameClicked(store.selectedThreadId)">Rename</span>
							</ContextMenuItem>
						</DialogTrigger>
						<ContextMenuItem @click="doDeleteThread(store.selectedThreadId)">Delete</ContextMenuItem>
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
