<script setup lang="ts">
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from './ui/context-menu';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useAppStore } from '../stores/main';
import type { ChatThread } from '~/lib/api/types-db';
import api from '~/lib/api/db';

const route = useRoute();
const isThreadSelected = (threadId: string) =>
	route.path.includes(`/chat`) && route.params.id === threadId;

const { threads, updateThreads } = useAppStore();

// TODO add option to fork a thread

const newThreadName = ref('');
const editingThreadName = ref('');
const rightClickedId = ref('');

onBeforeMount(async () => {
	await updateThreads();
});

const renameClicked = (threadId: string) => {
	const thread = threads.find((thread) => thread.id === threadId);
	if (!thread) {
		console.error(`Couldn't find thread with id ${threadId} to rename`);
		editingThreadName.value = '';
		return;
	}
	editingThreadName.value = thread.name;
};
const handleRename = async () => {
	if (!editingThreadName.value) return;

	await api.thread.updateOne(rightClickedId.value, {
		name: editingThreadName.value,
	});
	editingThreadName.value = '';

	await updateThreads();
};

const doCreateThread = async () => {
	if (!newThreadName.value) return;

	const newThread = await api.thread.createOne({
		name: newThreadName.value,
		mode: 'persona',
	});
	await updateThreads();
	navigateTo(`/chat/${newThread.id}`);
};

const doDeleteThread = async (threadId: string) => {
	await api.thread.removeOne(threadId);

	const newThreads = await updateThreads();
	if (newThreads.length > 0) {
		await navigateTo(`/chat/${newThreads[0].id}`);
	} else {
		await navigateTo(`/`);
	}
};

// TODO this is a bandaid fix
watch(route, async () => {
	await updateThreads();
});
</script>

<template>
	<div class="sidebar">
		<div class="flex w-full mb-4 px-2">
			<Input
				v-model="newThreadName"
				placeholder="Chat name"
				@keyup.enter="doCreateThread"
			/>
			<Button @click="doCreateThread">+</Button>
		</div>
		<ul>
			<Dialog>
				<ContextMenu>
					<ContextMenuTrigger>
						<li
							v-for="thread in threads"
							:key="thread.id"
							:class="[
								'cursor-pointer',
								'hover:bg-gray-200',
								'p-1',
								'rounded',
								isThreadSelected(thread.id) ? 'font-bold bg-gray-200' : '',
							]"
							@contextmenu="rightClickedId = thread.id"
						>
							<NuxtLink :to="`/chat/${thread.id}`" class="block p-1">
								{{ thread.name }}
							</NuxtLink>
						</li>
					</ContextMenuTrigger>
					<ContextMenuContent>
						<!-- TODO fix to not use selected thread -->
						<DialogTrigger asChild>
							<ContextMenuItem>
								<span @click="renameClicked(rightClickedId)">Rename</span>
							</ContextMenuItem>
						</DialogTrigger>
						<ContextMenuItem @click="doDeleteThread(rightClickedId)">
							Delete
						</ContextMenuItem>
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
